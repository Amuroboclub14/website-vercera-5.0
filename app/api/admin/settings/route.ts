import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const SETTINGS_DOC = 'site'
const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

/** GET: Return site settings (eventsVisible). Owner/super_admin only. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getVerceraFirestore()
    const doc = await db.collection('settings').doc(SETTINGS_DOC).get()
    const data = doc.data()
    const eventsVisible = data?.eventsVisible === true
    return NextResponse.json({ eventsVisible })
  } catch (err) {
    console.error('Settings GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

/** PATCH: Update site settings (eventsVisible). Owner/super_admin only. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const eventsVisible = body.eventsVisible === true
    const db = getVerceraFirestore()
    await db.collection('settings').doc(SETTINGS_DOC).set(
      { eventsVisible, updatedAt: new Date().toISOString() },
      { merge: true }
    )
    return NextResponse.json({ eventsVisible })
  } catch (err) {
    console.error('Settings PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
