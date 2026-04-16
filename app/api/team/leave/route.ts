import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'

/**
 * POST: Leave current team for an event.
 * - If leaving member is the only member, team doc is deleted.
 * - If leaving member is leader and others remain, leadership is handed to next member.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = await request.json()
    const eventId = String(body?.eventId ?? '').trim()
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const teamSnap = await db
      .collection('teams')
      .where('eventId', '==', eventId)
      .where('memberIds', 'array-contains', userId)
      .limit(1)
      .get()

    if (teamSnap.empty) {
      return NextResponse.json({ error: 'You are not in a team for this event' }, { status: 404 })
    }

    const teamDoc = teamSnap.docs[0]
    const nowIso = new Date().toISOString()

    const result = await db.runTransaction(async (tx) => {
      const teamRef = db.collection('teams').doc(teamDoc.id)
      const teamFresh = await tx.get(teamRef)
      if (!teamFresh.exists) {
        throw new Error('TEAM_NOT_FOUND')
      }

      const teamData = teamFresh.data() as {
        verceraTeamId?: string
        leaderUserId?: string
        leaderVerceraId?: string
        members?: Array<{ userId: string; verceraId: string; fullName: string; email: string; isLeader?: boolean }>
        memberIds?: string[]
      }

      const members = teamData.members ?? []
      const memberIds = teamData.memberIds ?? members.map((m) => m.userId)
      if (!memberIds.includes(userId)) {
        throw new Error('NOT_IN_TEAM')
      }

      const remainingMembers = members.filter((m) => m.userId !== userId)
      const remainingIds = memberIds.filter((id) => id !== userId)
      const leavingWasLeader = teamData.leaderUserId === userId || members.find((m) => m.userId === userId)?.isLeader === true

      const leavingRegsSnap = await tx.get(
        db.collection('registrations').where('userId', '==', userId).where('eventId', '==', eventId)
      )
      for (const regDoc of leavingRegsSnap.docs) {
        tx.update(regDoc.ref, {
          teamId: null,
          verceraTeamId: null,
          isTeamLeader: false,
        })
      }

      if (remainingMembers.length === 0) {
        tx.delete(teamRef)
        return {
          deletedTeam: true,
          reassignedLeaderUserId: null as string | null,
        }
      }

      const nextLeader = leavingWasLeader ? remainingMembers[0] : remainingMembers.find((m) => m.userId === teamData.leaderUserId) ?? remainingMembers[0]
      const nextLeaderUserId = nextLeader.userId
      const normalizedMembers = remainingMembers.map((m) => ({
        ...m,
        isLeader: m.userId === nextLeaderUserId,
      }))

      tx.update(teamRef, {
        members: normalizedMembers,
        memberIds: remainingIds,
        size: normalizedMembers.length,
        leaderUserId: nextLeaderUserId,
        leaderVerceraId: nextLeader.verceraId ?? null,
        updatedAt: nowIso,
      })

      const newLeaderRegsSnap = await tx.get(
        db.collection('registrations').where('userId', '==', nextLeaderUserId).where('eventId', '==', eventId)
      )
      for (const regDoc of newLeaderRegsSnap.docs) {
        tx.update(regDoc.ref, {
          isTeamLeader: true,
          teamId: teamDoc.id,
          verceraTeamId: teamData.verceraTeamId ?? null,
        })
      }

      return {
        deletedTeam: false,
        reassignedLeaderUserId: leavingWasLeader ? nextLeaderUserId : null,
      }
    })

    return NextResponse.json({
      success: true,
      deletedTeam: result.deletedTeam,
      reassignedLeaderUserId: result.reassignedLeaderUserId,
      message: result.deletedTeam
        ? 'You left the team. Team had no other members, so it was deleted.'
        : result.reassignedLeaderUserId
          ? 'You left the team. Leadership was reassigned.'
          : 'You left the team.',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    if (msg === 'TEAM_NOT_FOUND') {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }
    if (msg === 'NOT_IN_TEAM') {
      return NextResponse.json({ error: 'You are not part of this team' }, { status: 400 })
    }
    console.error('Leave team error:', err)
    return NextResponse.json({ error: 'Failed to leave team' }, { status: 500 })
  }
}

