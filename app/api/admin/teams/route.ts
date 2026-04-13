import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin', 'event_admin'] as const

type TeamMember = {
  userId?: string
  verceraId?: string
  fullName?: string
  email?: string
  isLeader?: boolean
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getVerceraFirestore()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)
    const eventIdFilter = (searchParams.get('eventId') || '').trim()
    const search = (searchParams.get('search') || '').trim().toLowerCase()

    const [teamsSnap, regsSnap, participantsSnap, eventsSnap] = await Promise.all([
      db.collection('teams').limit(limit).get(),
      db.collection('registrations').get(),
      db.collection('vercera_5_participants').get(),
      db.collection('events').get(),
    ])

    const regsByTeamId: Record<string, Array<{ id: string; attended?: boolean }>> = {}
    for (const d of regsSnap.docs) {
      const row = d.data() as { teamId?: string; attended?: boolean }
      const teamId = row.teamId
      if (!teamId) continue
      if (!regsByTeamId[teamId]) regsByTeamId[teamId] = []
      regsByTeamId[teamId].push({ id: d.id, attended: row.attended })
    }

    const participantById: Record<string, { fullName?: string; email?: string; verceraId?: string }> = {}
    for (const d of participantsSnap.docs) {
      const p = d.data() as { fullName?: string; email?: string; verceraId?: string }
      participantById[d.id] = { fullName: p.fullName, email: p.email, verceraId: p.verceraId }
    }

    const eventNameById: Record<string, string> = {}
    for (const d of eventsSnap.docs) {
      const e = d.data() as { name?: string }
      eventNameById[d.id] = e.name ?? d.id
    }

    let teams = teamsSnap.docs.map((doc) => {
      const t = doc.data() as {
        verceraTeamId?: string
        teamName?: string
        eventId?: string
        eventName?: string
        members?: TeamMember[]
        memberIds?: string[]
        size?: number
        isTeamEvent?: boolean
        leaderUserId?: string
        leaderVerceraId?: string
        amountPaid?: number
        paidByUserId?: string
        razorpayOrderId?: string
        razorpayPaymentId?: string
        createdAt?: string
      }

      const regs = regsByTeamId[doc.id] ?? []
      const attendedCount = regs.filter((r) => r.attended === true).length
      const registrationCount = regs.length
      const leaderProfile = t.leaderUserId ? participantById[t.leaderUserId] : undefined
      const members = Array.isArray(t.members) ? t.members : []

      return {
        id: doc.id,
        verceraTeamId: t.verceraTeamId ?? '',
        teamName: t.teamName ?? null,
        eventId: t.eventId ?? null,
        eventName: t.eventName ?? (t.eventId ? eventNameById[t.eventId] ?? t.eventId : null),
        isTeamEvent: Boolean(t.isTeamEvent),
        size: Number(t.size) || members.length || 0,
        memberIds: Array.isArray(t.memberIds) ? t.memberIds : members.map((m) => m.userId).filter(Boolean),
        members,
        leaderUserId: t.leaderUserId ?? null,
        leaderVerceraId: t.leaderVerceraId ?? leaderProfile?.verceraId ?? null,
        leaderName: leaderProfile?.fullName ?? members.find((m) => m.isLeader)?.fullName ?? null,
        leaderEmail: leaderProfile?.email ?? members.find((m) => m.isLeader)?.email ?? null,
        amountPaid: Number(t.amountPaid) || 0,
        paidByUserId: t.paidByUserId ?? null,
        razorpayOrderId: t.razorpayOrderId ?? null,
        razorpayPaymentId: t.razorpayPaymentId ?? null,
        createdAt: t.createdAt ?? null,
        registrationCount,
        attendedCount,
        pendingAttendanceCount: Math.max(registrationCount - attendedCount, 0),
        registrationIds: regs.map((r) => r.id),
      }
    })

    if (eventIdFilter) {
      teams = teams.filter((t) => t.eventId === eventIdFilter)
    }

    if (search) {
      teams = teams.filter((t) => {
        const memberHit = t.members.some((m) =>
          `${m.fullName ?? ''} ${m.email ?? ''} ${m.verceraId ?? ''} ${m.userId ?? ''}`
            .toLowerCase()
            .includes(search)
        )
        return (
          (t.verceraTeamId || '').toLowerCase().includes(search) ||
          (t.teamName || '').toLowerCase().includes(search) ||
          (t.eventName || '').toLowerCase().includes(search) ||
          (t.eventId || '').toLowerCase().includes(search) ||
          (t.leaderName || '').toLowerCase().includes(search) ||
          (t.leaderEmail || '').toLowerCase().includes(search) ||
          memberHit
        )
      })
    }

    teams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    return NextResponse.json({
      teams,
      meta: {
        totalTeams: teams.length,
      },
    })
  } catch (err) {
    console.error('Admin teams list error:', err)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

