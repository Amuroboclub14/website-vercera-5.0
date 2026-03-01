import { NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import type { EventRecord } from '@/lib/events-types'

export const dynamic = 'force-dynamic'

const SETTINGS_DOC = 'site'

/** GET: List all events from Firestore with registeredCount. Public. Respects settings.eventsVisible. */
export async function GET() {
  try {
    const db = getVerceraFirestore()
    const [settingsSnap, eventsSnap, regsSnap] = await Promise.all([
      db.collection('settings').doc(SETTINGS_DOC).get(),
      db.collection('events').get(),
      db.collection('registrations').get(),
    ])
    const eventsVisible = settingsSnap.data()?.eventsVisible === true
    if (!eventsVisible) {
      return NextResponse.json({ events: [], eventsVisible: false })
    }

    const countByEventId: Record<string, number> = {}
    regsSnap.docs.forEach((d) => {
      const eid = d.data().eventId as string
      if (eid) countByEventId[eid] = (countByEventId[eid] || 0) + 1
    })

    const eventsList: EventRecord[] = eventsSnap.docs.map((doc) => {
      const d = doc.data()
      const eventImages = Array.isArray(d.eventImages) ? d.eventImages : []
      const image = eventImages[0] ?? d.image ?? ''
      const rulebookUrls = Array.isArray(d.rulebookUrls) ? d.rulebookUrls : []
      const rulebookUrl = rulebookUrls[0] ?? (typeof d.rulebookUrl === 'string' ? d.rulebookUrl : undefined)
      return {
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
        registeredCount: countByEventId[doc.id] ?? 0,
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
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }
    })

    eventsList.sort((a, b) => {
      const oa = a.order ?? 999
      const ob = b.order ?? 999
      if (oa !== ob) return oa - ob
      return (a.createdAt || '').localeCompare(b.createdAt || '')
    })

    return NextResponse.json({ events: eventsList, eventsVisible: true })
  } catch (err) {
    console.error('Events list error:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
