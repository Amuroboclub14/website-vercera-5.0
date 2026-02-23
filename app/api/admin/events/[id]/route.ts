import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

/** GET: Single event (admin). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const doc = await db.collection('events').doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const regsSnap = await db.collection('registrations').where('eventId', '==', id).get()
    const d = doc.data()!
    return NextResponse.json({
      id: doc.id,
      ...d,
      registeredCount: regsSnap.size,
    })
  } catch (err) {
    console.error('Admin get event error:', err)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

/** PUT: Update event. Owner/super_admin only. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const body = await request.json()
    const {
      name,
      category,
      description,
      longDescription,
      image,
      date,
      time,
      venue,
      registrationFee,
      prizePool,
      maxParticipants,
      rules,
      prizes,
      isTeamEvent,
      teamSizeMin,
      teamSizeMax,
      rulebookUrl,
      order,
    } = body

    const db = getVerceraFirestore()
    const ref = db.collection('events').doc(id)
    const existing = await ref.get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const data: Record<string, unknown> = {
      updatedAt: now,
    }
    if (name !== undefined) data.name = String(name)
    if (category !== undefined) data.category = category === 'non-technical' ? 'non-technical' : 'technical'
    if (description !== undefined) data.description = String(description)
    if (longDescription !== undefined) data.longDescription = String(longDescription)
    if (image !== undefined) data.image = String(image)
    if (date !== undefined) data.date = String(date)
    if (time !== undefined) data.time = String(time)
    if (venue !== undefined) data.venue = String(venue)
    if (registrationFee !== undefined) data.registrationFee = Number(registrationFee) || 0
    if (prizePool !== undefined) data.prizePool = Number(prizePool) || 0
    if (maxParticipants !== undefined) data.maxParticipants = Number(maxParticipants) || 1
    if (rules !== undefined) data.rules = Array.isArray(rules) ? rules : []
    if (prizes !== undefined) data.prizes = Array.isArray(prizes) ? prizes : []
    if (isTeamEvent !== undefined) data.isTeamEvent = Boolean(isTeamEvent)
    if (teamSizeMin !== undefined) data.teamSizeMin = teamSizeMin == null ? null : Number(teamSizeMin)
    if (teamSizeMax !== undefined) data.teamSizeMax = teamSizeMax == null ? null : Number(teamSizeMax)
    if (rulebookUrl !== undefined) data.rulebookUrl = rulebookUrl && String(rulebookUrl).trim() ? String(rulebookUrl).trim() : null
    if (order !== undefined) data.order = order == null ? 0 : Number(order)

    await ref.update(data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin update event error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

/** DELETE: Delete event. Owner/super_admin only. Fails if event has registrations. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const ref = db.collection('events').doc(id)
    const existing = await ref.get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const regsSnap = await db.collection('registrations').where('eventId', '==', id).limit(1).get()
    if (!regsSnap.empty) {
      return NextResponse.json(
        { error: 'Cannot delete event that has registrations' },
        { status: 400 }
      )
    }
    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin delete event error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
