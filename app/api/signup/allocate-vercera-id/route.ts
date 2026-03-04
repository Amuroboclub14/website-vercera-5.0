import { NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { generateVerceraId } from '@/lib/vercera-id'

/**
 * POST /api/signup/allocate-vercera-id
 * Returns a unique Vercera ID for use during signup.
 * Called before Firebase Auth signup so the client doesn't need to query Firestore
 * (which would require auth and fail under "read own doc only" rules).
 */
export async function POST() {
  try {
    const db = getVerceraFirestore()
    const maxAttempts = 15
    for (let i = 0; i < maxAttempts; i++) {
      const verceraId = generateVerceraId()
      const snap = await db
        .collection('vercera_5_participants')
        .where('verceraId', '==', verceraId)
        .limit(1)
        .get()
      if (snap.empty) {
        return NextResponse.json({ verceraId })
      }
    }
    return NextResponse.json(
      { error: 'Could not generate unique Vercera ID. Please try again.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('[allocate-vercera-id]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
