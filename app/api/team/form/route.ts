import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { generateVerceraTeamId } from '@/lib/vercera-team-id'

/** POST: Form a new team for an event. User must be registered (paid) for the event. */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { eventId, teamName } = body
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    const eventDoc = await db.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const eventData = eventDoc.data()!
    const isTeamEvent = Boolean(eventData.isTeamEvent)
    if (!isTeamEvent) {
      return NextResponse.json({ error: 'This event is not a team event' }, { status: 400 })
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
      return NextResponse.json({ error: 'Registration must be paid to form a team' }, { status: 400 })
    }
    if (regData.teamId) {
      return NextResponse.json({ error: 'You are already in a team for this event' }, { status: 400 })
    }

    const participantSnap = await db.collection('vercera_5_participants').doc(userId).get()
    const participantData = participantSnap.data()
    const verceraId = (participantData?.verceraId as string) ?? ''
    const fullName = (participantData?.fullName as string) ?? ''
    const email = (participantData?.email as string) ?? ''

    const verceraTeamId = generateVerceraTeamId()
    const eventName = (eventData.name as string) ?? 'Event'
    const members = [{ userId, verceraId, fullName, email, isLeader: true }]
    const memberIds = [userId]
    const teamSize = 1

    const teamRef = await db.collection('teams').add({
      verceraTeamId,
      eventId,
      eventName,
      teamName: (teamName && String(teamName).trim()) || null,
      leaderUserId: userId,
      leaderVerceraId: verceraId,
      members,
      memberIds,
      size: teamSize,
      isTeamEvent: true,
      createdAt: new Date().toISOString(),
    })

    await db.collection('registrations').doc(regDoc.id).update({
      teamId: teamRef.id,
      verceraTeamId,
      isTeamEvent: true,
      isTeamLeader: true,
    })

    return NextResponse.json({
      success: true,
      teamId: teamRef.id,
      verceraTeamId,
      message: 'Team created. Share your Team ID for others to join.',
    })
  } catch (err) {
    console.error('Form team error:', err)
    return NextResponse.json({ error: 'Failed to form team' }, { status: 500 })
  }
}
