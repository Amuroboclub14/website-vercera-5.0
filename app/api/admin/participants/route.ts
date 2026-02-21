import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const db = getVerceraFirestore()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    let query = db.collection('vercera_5_participants').limit(limit)

    // Client-side filter when search is provided (Firestore has no full-text search)
    const snapshot = await query.get()
    let participants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{ id: string; fullName?: string; email?: string; verceraId?: string; [k: string]: unknown }>

    if (search) {
      participants = participants.filter((p) => {
        const name = (p.fullName || '').toLowerCase()
        const email = (p.email || '').toLowerCase()
        const verceraId = (p.verceraId || '').toLowerCase()
        return name.includes(search) || email.includes(search) || verceraId.includes(search)
      })
    }

    return NextResponse.json({ participants })
  } catch (err) {
    console.error('Admin participants list error:', err)
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
  }
}
