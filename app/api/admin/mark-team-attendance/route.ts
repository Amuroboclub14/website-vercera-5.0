import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin', 'event_admin'] as const

export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  const adminUid = auth.uid
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
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    const teamDoc = teamSnap.docs[0]
    const teamId = teamDoc.id
    const nowIso = new Date().toISOString()

    const regsSnap = await db
      .collection('registrations')
      .where('teamId', '==', teamId)
      .get()

    const batch = db.batch()
    for (const doc of regsSnap.docs) {
      batch.update(doc.ref, {
        attended: true,
        attendanceMarkedAt: nowIso,
        attendanceMarkedBy: adminUid,
      })
    }
    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${regsSnap.size} team member(s)`,
      count: regsSnap.size,
    })
  } catch (err) {
    console.error('Mark team attendance error:', err)
    return NextResponse.json(
      { error: 'Failed to mark team attendance' },
      { status: 500 }
    )
  }
}
