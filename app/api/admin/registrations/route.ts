import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const db = getVerceraFirestore()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    const snapshot = await db
      .collection('registrations')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    let registrations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<Record<string, unknown> & { id: string; eventId?: string; status?: string }>

    if (eventId) registrations = registrations.filter((r) => r.eventId === eventId)
    if (status) registrations = registrations.filter((r) => r.status === status)

    return NextResponse.json({ registrations })
  } catch (err) {
    console.error('Admin registrations list error:', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
