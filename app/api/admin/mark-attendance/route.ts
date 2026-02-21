import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, eventId, attended } = body

    if (!registrationId || eventId === undefined || attended === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    await db.collection('registrations').doc(registrationId).update({
      attended: Boolean(attended),
      attendanceMarkedAt: new Date().toISOString(),
      attendanceMarkedBy: body.adminId || 'admin', // You can add admin authentication later
    })

    return NextResponse.json({ success: true, message: `Attendance ${attended ? 'marked' : 'unmarked'} successfully` })
  } catch (err) {
    console.error('Mark attendance error:', err)
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
  }
}
