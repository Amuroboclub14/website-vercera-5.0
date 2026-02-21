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

    const [regsSnap, participantsSnap, teamsSnap] = await Promise.all([
      db.collection('registrations').get(),
      db.collection('vercera_5_participants').get(),
      db.collection('teams').get(),
    ])

    const registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string
      amount?: number
      status?: string
      eventId?: string
      eventName?: string
      attended?: boolean
      createdAt?: string
    }>

    const totalRevenue = registrations
      .filter((r) => r.status === 'paid' || r.status === 'completed')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

    const totalRegistrations = registrations.length
    const paidCount = registrations.filter((r) => r.status === 'paid' || r.status === 'completed').length
    const attendedCount = registrations.filter((r) => r.attended === true).length

    const eventWise: Record<string, { count: number; revenue: number; attended: number }> = {}
    for (const r of registrations) {
      const eid = r.eventId || 'unknown'
      if (!eventWise[eid]) eventWise[eid] = { count: 0, revenue: 0, attended: 0 }
      eventWise[eid].count += 1
      if (r.status === 'paid' || r.status === 'completed') {
        eventWise[eid].revenue += Number(r.amount) || 0
      }
      if (r.attended) eventWise[eid].attended += 1
    }

    const recentRegistrations = registrations
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 10)

    return NextResponse.json({
      totalParticipants: participantsSnap.size,
      totalTeams: teamsSnap.size,
      totalRegistrations,
      paidCount,
      attendedCount,
      totalRevenue,
      eventWise,
      recentRegistrations,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
