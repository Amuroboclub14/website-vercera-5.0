import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid
  try {
    const db = getVerceraFirestore()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    const snapshot = await db.collection('registrations').limit(limit).get()

    let registrations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<
      Record<string, unknown> & {
        id: string
        userId?: string
        eventId?: string
        status?: string
        createdAt?: string
        verceraTeamId?: string
        teamId?: string
      }
    >

    registrations.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    )
    if (eventId) registrations = registrations.filter((r) => r.eventId === eventId)
    if (status) registrations = registrations.filter((r) => r.status === status)

    const userIds = [...new Set(registrations.map((r) => r.userId).filter(Boolean))] as string[]
    const participantMap: Record<string, { fullName: string; email?: string }> = {}
    if (userIds.length > 0) {
      await Promise.all(
        userIds.map(async (uid) => {
          const snap = await db.collection('vercera_5_participants').doc(uid).get()
          const d = snap.data()
          participantMap[uid] = {
            fullName: (d?.fullName as string) || '—',
            email: d?.email as string | undefined,
          }
        })
      )
    }

    const enriched = registrations.map((r) => ({
      ...r,
      participantName: r.userId ? participantMap[r.userId]?.fullName ?? '—' : '—',
      participantEmail: r.userId ? participantMap[r.userId]?.email ?? null : null,
    }))

    return NextResponse.json({ registrations: enriched })
  } catch (err) {
    console.error('Admin registrations list error:', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
