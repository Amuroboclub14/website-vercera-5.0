import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import type { EventRecord } from '@/lib/events-types'

export const dynamic = 'force-dynamic'

/** GET: Single event by id. Public. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })

    const db = getVerceraFirestore()
    const [settingsSnap, doc] = await Promise.all([
      db.collection('settings').doc('site').get(),
      db.collection('events').doc(id).get(),
    ])
    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (settingsSnap.data()?.eventsVisible !== true) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const regsSnap = await db.collection('registrations').where('eventId', '==', id).get()
    const d = doc.data()!
    const eventImages = Array.isArray(d.eventImages) ? d.eventImages : []
    const image = eventImages[0] ?? d.image ?? ''
    const rulebookUrls = Array.isArray(d.rulebookUrls) ? d.rulebookUrls : []
    const rulebookUrl = rulebookUrls[0] ?? (typeof d.rulebookUrl === 'string' ? d.rulebookUrl : undefined)

    const event: EventRecord = {
      id: doc.id,
      name: d.name ?? '',
      category: (d.category as EventRecord['category']) ?? 'technical',
      description: d.description ?? '',
      longDescription: d.longDescription ?? '',
      image,
      date: d.date ?? '',
      time: d.time ?? '',
      venue: d.venue ?? '',
      registrationFee: Number(d.registrationFee) ?? 0,
      prizePool: Number(d.prizePool) ?? 0,
      maxParticipants: Number(d.maxParticipants) ?? 0,
      registeredCount: regsSnap.size,
      rules: Array.isArray(d.rules) ? d.rules : [],
      prizes: Array.isArray(d.prizes) ? d.prizes : [],
      isTeamEvent: Boolean(d.isTeamEvent),
      teamSizeMin: d.teamSizeMin != null ? Number(d.teamSizeMin) : undefined,
      teamSizeMax: d.teamSizeMax != null ? Number(d.teamSizeMax) : undefined,
      rulebookUrl,
      eventImages: eventImages.length ? eventImages : undefined,
      rulebookUrls: rulebookUrls.length ? rulebookUrls : undefined,
      attachmentUrls: Array.isArray(d.attachmentUrls) && d.attachmentUrls.length ? d.attachmentUrls : undefined,
      order: d.order != null ? Number(d.order) : undefined,
      flagship: Boolean(d.flagship),
      flagshipSponsor:
        d.flagshipSponsor && typeof d.flagshipSponsor === 'object'
          ? (d.flagshipSponsor as EventRecord['flagshipSponsor'])
          : undefined,
      specialCategoryAward:
        d.specialCategoryAward && typeof d.specialCategoryAward === 'object'
          ? (d.specialCategoryAward as EventRecord['specialCategoryAward'])
          : undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }

    return NextResponse.json(event)
  } catch (err) {
    console.error('Event get error:', err)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
