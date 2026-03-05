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

    const [regsSnap, participantsSnap, teamsSnap, txSnap] = await Promise.all([
      db.collection('registrations').get(),
      db.collection('vercera_5_participants').get(),
      db.collection('teams').get(),
      db.collection('transactions').get(),
    ])

    const registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string
      status?: string
      eventId?: string
      attended?: boolean
      createdAt?: string
    }>

    const transactions = txSnap.docs.map((d) => d.data()) as Array<{
      type?: string
      amount?: number
      eventId?: string
    }>

    const totalRevenue = Math.round(
      transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) * 100
    ) / 100

    const totalRegistrations = registrations.length
    const paidCount = registrations.filter((r) => r.status === 'paid' || r.status === 'completed').length
    const attendedCount = registrations.filter((r) => r.attended === true).length

    const eventWise: Record<string, { count: number; revenue: number; attended: number }> = {}
    for (const r of registrations) {
      const eid = r.eventId || 'unknown'
      if (!eventWise[eid]) eventWise[eid] = { count: 0, revenue: 0, attended: 0 }
      eventWise[eid].count += 1
      if (r.attended) eventWise[eid].attended += 1
    }
    for (const t of transactions) {
      if (t.type === 'event' && t.eventId) {
        if (!eventWise[t.eventId]) eventWise[t.eventId] = { count: 0, revenue: 0, attended: 0 }
        eventWise[t.eventId].revenue += Number(t.amount) || 0
      }
    }

    const recentRegistrations = registrations
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 10)

    const eventsSnap = await db.collection('events').get()
    const eventNames: Record<string, string> = {}
    eventsSnap.docs.forEach((doc) => {
      const name = (doc.data() as { name?: string }).name
      eventNames[doc.id] = name ?? doc.id
    })

    return NextResponse.json({
      totalParticipants: participantsSnap.size,
      totalTeams: teamsSnap.size,
      totalRegistrations,
      paidCount,
      attendedCount,
      totalRevenue,
      eventWise,
      eventNames,
      recentRegistrations,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
