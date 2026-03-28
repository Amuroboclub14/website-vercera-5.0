import { NextRequest, NextResponse } from 'next/server'
import { getVerceraAdminAuth } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * POST { email: string }
 * Returns { available: true } if no existing account uses this email (Auth + participant profile).
 */
export async function POST(request: NextRequest) {
  try {
    let body: { email?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const raw = body.email
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const email = normalizeEmail(raw)
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const profileSnap = await db.collection('vercera_5_participants').where('email', '==', email).limit(1).get()
    if (!profileSnap.empty) {
      return NextResponse.json({
        available: false,
        error: 'An account with this email already exists. Please sign in.',
      })
    }

    const auth = getVerceraAdminAuth()
    try {
      await auth.getUserByEmail(email)
      return NextResponse.json({
        available: false,
        error: 'An account with this email already exists. Please sign in.',
      })
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : ''
      if (code === 'auth/user-not-found') {
        return NextResponse.json({ available: true })
      }
      throw e
    }
  } catch (err) {
    console.error('[check-email]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
