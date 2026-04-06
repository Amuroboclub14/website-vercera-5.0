import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'

type Body = {
  eventId?: string
  bundleId?: string
  returnUrl?: string
  additionalInfo?: string | null
}

function isAllowedReturnUrl(raw: string | undefined): boolean {
  if (!raw) return false
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    const allowed = (process.env.EV_ALLOWED_RETURN_HOSTS || 'www.vercera.in,vercera.in,localhost')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
    return allowed.includes(host)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = (await request.json()) as Body
    const eventId = body.eventId?.trim() || undefined
    const bundleId = body.bundleId?.trim() || undefined
    const returnUrl = body.returnUrl?.trim() || undefined
    const additionalInfo = body.additionalInfo?.trim() || null

    if ((eventId && bundleId) || (!eventId && !bundleId)) {
      return NextResponse.json({ error: 'Provide exactly one of eventId or bundleId' }, { status: 400 })
    }
    if (!isAllowedReturnUrl(returnUrl)) {
      return NextResponse.json({ error: 'Invalid return URL' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const userSnap = await db.collection('vercera_5_participants').doc(userId).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }
    const profile = userSnap.data() as { email?: string; fullName?: string }

    let eventName = ''
    let amountInr = 0
    if (bundleId) {
      const bundleSnap = await db.collection('bundles').doc(bundleId).get()
      if (!bundleSnap.exists) {
        return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
      }
      const bundle = bundleSnap.data() as { name?: string; price?: number }
      eventName = bundle.name ?? 'Pack'
      amountInr = Number(bundle.price ?? 0)
    } else if (eventId) {
      const eventSnap = await db.collection('events').doc(eventId).get()
      if (!eventSnap.exists) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      const event = eventSnap.data() as { name?: string; registrationFee?: number }
      eventName = event.name ?? 'Event'
      amountInr = Number(event.registrationFee ?? 0)
    }

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json({ error: 'Invalid configured price' }, { status: 400 })
    }

    const checkoutId = randomUUID()
    const now = Date.now()
    const expiresAtMs = now + 15 * 60 * 1000

    await db.collection('ev_checkout_sessions').doc(checkoutId).set({
      checkoutId,
      userId,
      email: profile.email ?? null,
      userName: profile.fullName ?? null,
      eventId: eventId ?? null,
      bundleId: bundleId ?? null,
      eventName,
      amountInr,
      returnUrl,
      additionalInfo,
      status: 'created',
      createdAtMs: now,
      expiresAtMs,
    })

    return NextResponse.json({
      checkoutId,
      expiresAtMs,
      checkoutUrl: `${(process.env.NEXT_PUBLIC_EV_CHECKOUT_URL || 'https://www.continuumworks.app').replace(/\/$/, '')}/ev/checkout`,
    })
  } catch (error) {
    console.error('create-checkout-session error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

