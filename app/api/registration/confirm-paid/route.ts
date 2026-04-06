import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generateVerceraTeamId } from '@/lib/vercera-team-id'
import { sendPaymentReceipt } from '@/lib/mail'

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

function getRazorpay() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

async function getExpectedAmountInr(
  db: FirebaseFirestore.Firestore,
  args: { bundleId?: string; eventId?: string }
): Promise<number | null> {
  if (args.bundleId) {
    const bundleSnap = await db.collection('bundles').doc(args.bundleId).get()
    if (!bundleSnap.exists) return null
    const price = Number((bundleSnap.data() as { price?: number }).price)
    return Number.isFinite(price) && price > 0 ? price : null
  }
  if (!args.eventId) return null
  const eventSnap = await db.collection('events').doc(args.eventId).get()
  if (!eventSnap.exists) return null
  const fee = Number((eventSnap.data() as { registrationFee?: number }).registrationFee)
  return Number.isFinite(fee) && fee > 0 ? fee : null
}

/**
 * Callback endpoint called by Continuum payment proxy after Razorpay payment is verified.
 * Continuum sends X-Callback-Secret and the same payload (no signature – already verified by Continuum).
 * This route writes the registration to Firestore (same logic as verify-payment, without Razorpay check).
 */
export async function POST(request: NextRequest) {
  try {
    const callbackSecret = request.headers.get('x-callback-secret')
    const expectedSecret = process.env.VERCERA_CALLBACK_SECRET
    if (!expectedSecret || callbackSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      orderId,
      paymentId,
      eventId,
      eventName,
      amount,
      userId,
      bundleId,
      team,
      teamName,
      memberEmails,
      additionalInfo,
    } = body as {
      orderId?: string
      paymentId?: string
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
      teamName?: string | null
      memberEmails?: string | null
      additionalInfo?: string | null
    }

    if (!orderId || !paymentId || amount == null || !userId) {
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

    const db = getVerceraFirestore()

    // Idempotency: if this order was already processed (registrations or transactions), return success
    const existingReg = await db.collection('registrations').where('razorpayOrderId', '==', orderId).limit(1).get()
    const existingTx = await db.collection('transactions').where('razorpayOrderId', '==', orderId).limit(1).get()
    if (!existingReg.empty || !existingTx.empty) {
      return NextResponse.json({ success: true, message: 'Payment already processed' })
    }

    const expectedAmountInr = await getExpectedAmountInr(db, { bundleId, eventId })
    if (expectedAmountInr == null) {
      return NextResponse.json({ error: 'Invalid product or pricing not found' }, { status: 400 })
    }
    const expectedAmountPaise = Math.round(expectedAmountInr * 100)
    const claimedAmountPaise = Math.round(Number(amount) * 100)
    if (!Number.isFinite(claimedAmountPaise) || claimedAmountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid amount payload' }, { status: 400 })
    }
    if (claimedAmountPaise !== expectedAmountPaise) {
      return NextResponse.json({ error: 'Amount mismatch detected' }, { status: 400 })
    }

    const razorpay = getRazorpay()
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ])
    if (!order || !payment || payment.order_id !== orderId) {
      return NextResponse.json({ error: 'Invalid Razorpay order/payment linkage' }, { status: 400 })
    }
    if (order.amount !== expectedAmountPaise || payment.amount !== expectedAmountPaise) {
      return NextResponse.json({ error: 'Razorpay amount mismatch detected' }, { status: 400 })
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'Payment is not successful' }, { status: 400 })
    }

    let leaderVerceraId: string | null = null
    try {
      const userDoc = await db.collection('vercera_5_participants').doc(userId).get()
      if (userDoc.exists) {
        leaderVerceraId = (userDoc.data() as { verceraId?: string }).verceraId || null
      }
    } catch {
      // continue
    }

    const nowIso = new Date().toISOString()
    const registrationDate = nowIso.split('T')[0]

    if (bundleId) {
      const alreadyBought = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .where('type', '==', 'pack')
        .where('bundleId', '==', bundleId)
        .limit(1)
        .get()
      if (!alreadyBought.empty) {
        return NextResponse.json({ success: true, message: 'Pack already purchased' })
      }

      const bundleSnap = await db.collection('bundles').doc(bundleId).get()
      const bundleData = bundleSnap.exists ? (bundleSnap.data() as { type?: string; name?: string }) : null
      const bundleType = bundleData?.type ?? 'all_events'
      const bundleName = bundleData?.name ?? null
      const hasAccommodation = bundleType === 'all_in_one'
      const totalAmount = expectedAmountInr

      await db.collection('transactions').add({
        userId,
        type: 'pack',
        bundleId,
        bundleName: bundleName ?? null,
        amount: totalAmount,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        hasAccommodation,
        createdAt: nowIso,
      })

      const userSnap = await db.collection('vercera_5_participants').doc(userId).get()
      const profileData = userSnap.exists ? (userSnap.data() as { email?: string; fullName?: string }) : null
      if (profileData?.email) {
        const receiptDate = new Date(nowIso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        sendPaymentReceipt({
          to: profileData.email,
          fullName: profileData.fullName || 'Participant',
          orderId,
          date: receiptDate,
          items: [{ name: bundleName ?? 'Pack', amount: totalAmount }],
          totalAmount,
        }).catch((e) => console.error('[confirm-paid] Receipt email failed', e))
      }
      return NextResponse.json({ success: true, message: 'Pack purchase recorded. Add events from the Events page or Dashboard.' })
    }

    const isTeamEvent = Boolean(team && team.isTeamEvent && team.members && team.members.length > 0)
    const registrationsRef = db.collection('registrations')

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
            { status: 400 }
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
        amountPaid: expectedAmountInr,
        paidByUserId: userId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        createdAt: nowIso,
      })

      const teamDocId = teamDoc.id
      const perMemberAmount = teamSize > 0 ? expectedAmountInr / teamSize : expectedAmountInr
      const teamAmount = expectedAmountInr
      await db.collection('transactions').add({
        userId,
        type: 'event',
        eventId,
        eventName: eventName ?? null,
        amount: teamAmount,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        createdAt: nowIso,
      })
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
      const amt = expectedAmountInr
      await db.collection('transactions').add({
        userId,
        type: 'event',
        eventId,
        eventName: eventName ?? null,
        amount: amt,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        createdAt: nowIso,
      })
      await db.collection('registrations').add({
        userId,
        verceraId: leaderVerceraId,
        eventId,
        eventName,
        amount: amt,
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

    const userSnap = await db.collection('vercera_5_participants').doc(userId).get()
    const profileData = userSnap.exists ? (userSnap.data() as { email?: string; fullName?: string }) : null
    if (profileData?.email) {
      const receiptDate = new Date(nowIso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      const amt = expectedAmountInr
      sendPaymentReceipt({
        to: profileData.email,
        fullName: profileData.fullName || 'Participant',
        orderId,
        date: receiptDate,
        items: [{ name: eventName ?? 'Event', amount: amt }],
        totalAmount: amt,
      }).catch((e) => console.error('[confirm-paid] Receipt email failed', e))
    }

    return NextResponse.json({ success: true, message: 'Payment verified and registration saved' })
  } catch (err) {
    console.error('confirm-paid error:', err)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
