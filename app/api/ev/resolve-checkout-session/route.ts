import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'

type ResolveBody = { checkoutId?: string }

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.EV_SESSION_SHARED_SECRET
  if (!expected) return false
  const received = request.headers.get('x-ev-session-secret') || ''
  return received === expected
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await request.json()) as ResolveBody
    const checkoutId = body.checkoutId?.trim()
    if (!checkoutId) {
      return NextResponse.json({ error: 'checkoutId required' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const snap = await db.collection('ev_checkout_sessions').doc(checkoutId).get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
    }

    const data = snap.data() as {
      checkoutId: string
      userId: string
      email: string | null
      userName: string | null
      eventId?: string | null
      bundleId?: string | null
      eventName: string
      amountInr: number
      returnUrl: string
      additionalInfo?: string | null
      status?: string
      expiresAtMs: number
    }

    if (!data.expiresAtMs || Date.now() > data.expiresAtMs) {
      return NextResponse.json({ error: 'Checkout session expired' }, { status: 410 })
    }
    if (data.status === 'consumed') {
      return NextResponse.json({ error: 'Checkout session already used' }, { status: 409 })
    }

    return NextResponse.json({
      checkoutId: data.checkoutId,
      userId: data.userId,
      email: data.email,
      userName: data.userName,
      eventId: data.eventId ?? null,
      bundleId: data.bundleId ?? null,
      eventName: data.eventName,
      amountInr: Number(data.amountInr),
      returnUrl: data.returnUrl,
      additionalInfo: data.additionalInfo ?? null,
      expiresAtMs: data.expiresAtMs,
    })
  } catch (error) {
    console.error('resolve-checkout-session error:', error)
    return NextResponse.json({ error: 'Failed to resolve checkout session' }, { status: 500 })
  }
}

