import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'

/** GET: Return current user's team details for a given event (if any). */
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  const eventId = request.nextUrl.searchParams.get('eventId')?.trim()
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }

  try {
    const db = getVerceraFirestore()

    // Primary source: teams collection membership
    const teamByMembership = await db
      .collection('teams')
      .where('eventId', '==', eventId)
      .where('memberIds', 'array-contains', userId)
      .limit(1)
      .get()

    let teamDoc: FirebaseFirestore.DocumentSnapshot | null = teamByMembership.docs[0] ?? null

    // Fallback: resolve by teamId / verceraTeamId from registrations if membership query misses.
    if (!teamDoc) {
      const regs = await db
        .collection('registrations')
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .get()
      if (!regs.empty) {
        const rows = regs.docs.map((d) => d.data() as { teamId?: string; verceraTeamId?: string })
        const teamId = rows.map((r) => (r.teamId || '').trim()).find(Boolean)
        if (teamId) {
          const byId = await db.collection('teams').doc(teamId).get()
          if (byId.exists) teamDoc = byId
        }
        if (!teamDoc) {
          const code = rows.map((r) => (r.verceraTeamId || '').trim()).find(Boolean)
          if (code) {
            const byCode = await db
              .collection('teams')
              .where('verceraTeamId', '==', code.toUpperCase())
              .limit(1)
              .get()
            teamDoc = byCode.docs[0] ?? null
          }
        }
      }
    }

    if (!teamDoc) {
      return NextResponse.json({ team: null })
    }

    const td = teamDoc.data() as {
      teamName?: string | null
      verceraTeamId?: string
      members?: Array<{ userId: string; verceraId: string; fullName: string; email: string; isLeader?: boolean }>
      size?: number
      leaderUserId?: string
    }

    return NextResponse.json({
      team: {
        id: teamDoc.id,
        teamName: td.teamName ?? null,
        verceraTeamId: String(td.verceraTeamId || ''),
        members: td.members ?? [],
        size: td.size ?? (td.members?.length ?? 0),
        leaderUserId: td.leaderUserId ?? null,
      },
    })
  } catch (err) {
    console.error('my-team error:', err)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}

