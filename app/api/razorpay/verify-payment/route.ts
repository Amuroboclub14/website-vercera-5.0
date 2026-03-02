import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generateVerceraTeamId } from '@/lib/vercera-team-id'
import { resolveBundleToEvents } from '@/lib/resolve-bundle'

function getVerceraFirestore() {
  const appName = 'vercera-firestore'
  if (getApps().some((app) => app.name === appName)) {
    return getFirestore(getApps().find((a) => a.name === appName)!)
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  let serviceAccount: ServiceAccount
  if (path) {
    serviceAccount = require(path) as ServiceAccount
  } else if (json) {
    serviceAccount = JSON.parse(json) as ServiceAccount
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH not configured')
  }

  initializeApp({ credential: cert(serviceAccount) }, appName)
  return getFirestore(getApps().find((a) => a.name === appName)!)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      paymentId,
      signature,
      eventId,
      eventName,
      amount,
      userId,
      bundleId,
      team,
      // legacy / fallback fields
      teamName,
      memberEmails,
      additionalInfo,
    } = body as {
      orderId?: string
      paymentId?: string
      signature?: string
      eventId?: string
      eventName?: string
      amount?: number
      userId?: string
      bundleId?: string
      team?: {
        isTeamEvent?: boolean
        teamName?: string
        teamSize?: number
        members?: {
          userId: string
          verceraId: string
          fullName: string
          email: string
          isLeader?: boolean
        }[]
      } | null
      teamName?: string
      memberEmails?: string | null
      additionalInfo?: string | null
    }

    if (!orderId || !paymentId || !signature || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (!bundleId && (!eventId || !eventName)) {
      return NextResponse.json(
        { error: 'eventId and eventName required when not using bundleId' },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    // Get leader's verceraId from profile
    let leaderVerceraId: string | null = null
    try {
      const userDoc = await db.collection('vercera_5_participants').doc(userId).get()
      if (userDoc.exists) {
        leaderVerceraId = (userDoc.data() as { verceraId?: string }).verceraId || null
      }
    } catch {
      // Continue without verceraId if profile fetch fails
    }

    const nowIso = new Date().toISOString()
    const registrationDate = nowIso.split('T')[0]

    // Bundle purchase: create one registration per event in the bundle (no team — user can form/join later)
    if (bundleId) {
      const events = await resolveBundleToEvents(bundleId)
      if (events.length === 0) {
        return NextResponse.json({ error: 'Bundle has no events or not found.' }, { status: 400 })
      }
      const totalAmount = Number(amount)
      const perRegistration = totalAmount / events.length
      const registrationsRef = db.collection('registrations')
      for (const { eventId: eid, eventName: ename } of events) {
        const existing = await registrationsRef
          .where('userId', '==', userId)
          .where('eventId', '==', eid)
          .limit(1)
          .get()
        if (!existing.empty) continue
        const eventSnap = await db.collection('events').doc(eid).get()
        const isTeamEvent = Boolean(eventSnap.exists && (eventSnap.data()?.isTeamEvent === true))
        await db.collection('registrations').add({
          userId,
          verceraId: leaderVerceraId,
          eventId: eid,
          eventName: ename,
          amount: Math.round(perRegistration * 100) / 100,
          registrationDate,
          status: 'paid',
          attended: false,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          bundleId,
          isTeamEvent,
          additionalInfo: additionalInfo || null,
          createdAt: nowIso,
        })
      }
      return NextResponse.json({ success: true, message: 'Payment verified and bundle registrations saved' })
    }

    const isTeamEvent = Boolean(team && team.isTeamEvent && team.members && team.members.length > 0)
    const registrationsRef = db.collection('registrations')

    // Guard: prevent duplicate registrations for this event
    if (!isTeamEvent) {
      const existingSolo = await registrationsRef
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .limit(1)
        .get()
      if (!existingSolo.empty) {
        return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 400 })
      }
    }

    if (isTeamEvent && team && team.members) {
      const teamSize = team.teamSize ?? team.members.length
      if (team.members.length === 0 || teamSize <= 0) {
        return NextResponse.json({ error: 'Invalid team configuration.' }, { status: 400 })
      }

      // Prevent any team member from having an existing registration for this event
      const memberIds = team.members.map((m) => m.userId).filter(Boolean)
      for (const memberId of memberIds) {
        const existing = await registrationsRef
          .where('userId', '==', memberId)
          .where('eventId', '==', eventId)
          .limit(1)
          .get()
        if (!existing.empty) {
          return NextResponse.json(
            { error: 'One or more team members are already registered for this event.' },
            { status: 400 },
          )
        }
      }

      const verceraTeamId = generateVerceraTeamId()

      const teamDoc = await db.collection('teams').add({
        verceraTeamId,
        eventId,
        eventName,
        teamName: team.teamName || null,
        leaderUserId: userId,
        leaderVerceraId,
        members: team.members,
        memberIds,
        size: teamSize,
        isTeamEvent: true,
        amountPaid: Number(amount),
        paidByUserId: userId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        createdAt: nowIso,
      })

      const teamDocId = teamDoc.id
      const perMemberAmount = teamSize > 0 ? Number(amount) / teamSize : Number(amount)

      const batch = db.batch()
      for (const member of team.members) {
        const regRef = db.collection('registrations').doc()
        batch.set(regRef, {
          userId: member.userId,
          verceraId: member.verceraId || null,
          eventId,
          eventName,
          amount: perMemberAmount,
          registrationDate,
          status: 'paid',
          attended: false,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          isTeamEvent: true,
          isTeamLeader: Boolean(member.isLeader),
          teamId: teamDocId,
          verceraTeamId,
          additionalInfo: additionalInfo || null,
          createdAt: nowIso,
        })
      }
      await batch.commit()
    } else {
      // Solo registration (backwards-compatible path)
      await db.collection('registrations').add({
        userId,
        verceraId: leaderVerceraId,
        eventId,
        eventName,
        amount: Number(amount),
        registrationDate,
        status: 'paid',
        attended: false,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        teamName: teamName || null,
        memberEmails: memberEmails || null,
        additionalInfo: additionalInfo || null,
        createdAt: nowIso,
      })
    }

    return NextResponse.json({ success: true, message: 'Payment verified and registration saved' })
  } catch (err) {
    console.error('Verify payment error:', err)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
