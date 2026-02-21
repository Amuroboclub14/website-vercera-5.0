import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin', 'event_admin'] as const

export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const { verceraTeamId } = body

    if (!verceraTeamId || typeof verceraTeamId !== 'string') {
      return NextResponse.json(
        { error: 'verceraTeamId is required' },
        { status: 400 }
      )
    }

    const id = (verceraTeamId as string).trim().toUpperCase()
    const db = getVerceraFirestore()

    const teamSnap = await db
      .collection('teams')
      .where('verceraTeamId', '==', id)
      .limit(1)
      .get()

    if (teamSnap.empty) {
      return NextResponse.json(
        { error: 'Team not found with this Vercera Team ID' },
        { status: 404 }
      )
    }

    const teamDoc = teamSnap.docs[0]
    const teamData = teamDoc.data()
    const teamId = teamDoc.id
    const eventId = teamData.eventId as string

    const regsSnap = await db
      .collection('registrations')
      .where('teamId', '==', teamId)
      .get()

    const registrations = regsSnap.docs.map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        userId: d.userId,
        verceraId: d.verceraId,
        eventId: d.eventId,
        eventName: d.eventName,
        status: d.status,
        amount: d.amount,
        attended: d.attended ?? false,
        isTeamLeader: d.isTeamLeader ?? false,
      }
    })

    const members = (teamData.members as Array<{ userId: string; verceraId: string; fullName: string; email: string; isLeader?: boolean }>) ?? []

    return NextResponse.json({
      success: true,
      team: {
        id: teamId,
        verceraTeamId: teamData.verceraTeamId,
        teamName: teamData.teamName ?? null,
        eventId: teamData.eventId,
        eventName: teamData.eventName,
        members,
        size: teamData.size ?? members.length,
      },
      registrations,
    })
  } catch (err) {
    console.error('Scan team error:', err)
    return NextResponse.json(
      { error: 'Failed to look up team' },
      { status: 500 }
    )
  }
}
