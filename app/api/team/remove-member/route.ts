import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'

/** POST: Team leader removes a member from their team for an event. */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = await request.json()
    const eventId = String(body?.eventId ?? '').trim()
    const memberUserId = String(body?.memberUserId ?? '').trim()
    if (!eventId || !memberUserId) {
      return NextResponse.json({ error: 'eventId and memberUserId are required' }, { status: 400 })
    }
    if (memberUserId === userId) {
      return NextResponse.json({ error: 'Leader cannot remove themselves' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const teamSnap = await db
      .collection('teams')
      .where('eventId', '==', eventId)
      .where('leaderUserId', '==', userId)
      .limit(1)
      .get()

    if (teamSnap.empty) {
      return NextResponse.json({ error: 'Team not found or you are not the leader' }, { status: 404 })
    }

    const teamDoc = teamSnap.docs[0]
    const teamData = teamDoc.data() as {
      members?: Array<{ userId: string; isLeader?: boolean }>
      memberIds?: string[]
    }
    const members = teamData.members ?? []
    const memberIds = teamData.memberIds ?? members.map((m) => m.userId)
    const target = members.find((m) => m.userId === memberUserId)
    if (!target) {
      return NextResponse.json({ error: 'Member is not in your team' }, { status: 400 })
    }
    if (target.isLeader) {
      return NextResponse.json({ error: 'Leader cannot be removed' }, { status: 400 })
    }

    const newMembers = members.filter((m) => m.userId !== memberUserId)
    const newMemberIds = memberIds.filter((id) => id !== memberUserId)

    const batch = db.batch()
    batch.update(teamDoc.ref, {
      members: newMembers,
      memberIds: newMemberIds,
      size: newMembers.length,
      updatedAt: new Date().toISOString(),
    })

    const regSnap = await db
      .collection('registrations')
      .where('userId', '==', memberUserId)
      .where('eventId', '==', eventId)
      .get()
    for (const regDoc of regSnap.docs) {
      batch.update(regDoc.ref, {
        teamId: null,
        verceraTeamId: null,
        isTeamLeader: false,
      })
    }
    await batch.commit()

    return NextResponse.json({ success: true, message: 'Member removed from team' })
  } catch (err) {
    console.error('Remove member error:', err)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}

