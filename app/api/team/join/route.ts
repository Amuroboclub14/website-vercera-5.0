import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'

/** POST: Join an existing team by team code (verceraTeamId). User must be registered (paid) for the event. */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { eventId, teamCode } = body
    if (!eventId || !teamCode) {
      return NextResponse.json({ error: 'eventId and teamCode are required' }, { status: 400 })
    }

    const db = getVerceraFirestore()
    const trimmedCode = String(teamCode).trim().toUpperCase()

    const teamSnap = await db
      .collection('teams')
      .where('eventId', '==', eventId)
      .where('verceraTeamId', '==', trimmedCode)
      .limit(1)
      .get()
    if (teamSnap.empty) {
      return NextResponse.json({ error: 'Team not found. Check the Team ID and event.' }, { status: 404 })
    }

    const teamDoc = teamSnap.docs[0]
    const teamId = teamDoc.id
    const teamData = teamDoc.data()
    const memberIds = (teamData.memberIds as string[]) ?? []
    if (memberIds.includes(userId)) {
      return NextResponse.json({ error: 'You are already in this team' }, { status: 400 })
    }

    const eventDoc = await db.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const eventData = eventDoc.data()!
    const teamSizeMax = Number(eventData.teamSizeMax) ?? memberIds.length + 1
    if (memberIds.length >= teamSizeMax) {
      return NextResponse.json({ error: 'This team is full' }, { status: 400 })
    }

    const regSnap = await db
      .collection('registrations')
      .where('userId', '==', userId)
      .where('eventId', '==', eventId)
      .limit(1)
      .get()
    if (regSnap.empty) {
      return NextResponse.json({ error: 'You must be registered for this event first' }, { status: 400 })
    }
    const regDoc = regSnap.docs[0]
    const regData = regDoc.data()
    if (regData.status !== 'paid') {
      return NextResponse.json({ error: 'Registration must be paid to join a team' }, { status: 400 })
    }
    if (regData.teamId) {
      return NextResponse.json({ error: 'You are already in a team for this event' }, { status: 400 })
    }

    const participantSnap = await db.collection('vercera_5_participants').doc(userId).get()
    const participantData = participantSnap.data()
    const verceraId = (participantData?.verceraId as string) ?? ''
    const fullName = (participantData?.fullName as string) ?? ''
    const email = (participantData?.email as string) ?? ''

    const members = (teamData.members as Array<{ userId: string; verceraId: string; fullName: string; email: string; isLeader?: boolean }>) ?? []
    const newMember = { userId, verceraId, fullName, email, isLeader: false }
    const newMembers = [...members, newMember]
    const newMemberIds = [...memberIds, userId]
    const newSize = newMembers.length

    await db.collection('teams').doc(teamId).update({
      members: newMembers,
      memberIds: newMemberIds,
      size: newSize,
    })

    await db.collection('registrations').doc(regDoc.id).update({
      teamId,
      verceraTeamId: trimmedCode,
      isTeamEvent: true,
      isTeamLeader: false,
    })

    return NextResponse.json({
      success: true,
      teamId,
      verceraTeamId: trimmedCode,
      message: 'You have joined the team.',
    })
  } catch (err) {
    console.error('Join team error:', err)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }
}
