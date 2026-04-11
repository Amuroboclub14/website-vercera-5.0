import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { resolveBundleToEvents } from '@/lib/resolve-bundle'

/**
 * POST /api/registration/add-from-pack
 * Body: { eventId: string }
 * Adds the event to the user's profile (creates a registration) using eligibility from a purchased pack.
 * User must have bought a pack that includes this event and must not already have a registration for it.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const body = await request.json().catch(() => ({}))
    const { eventId } = body as { eventId?: string }
    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    const packTx = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .where('type', '==', 'pack')
      .get()

    let foundBundleId: string | null = null
    let foundBundleName: string | null = null
    let foundHasAccommodation = false
    let eventName = ''

    for (const doc of packTx.docs) {
      const d = doc.data()
      const bundleId = d.bundleId as string
      if (!bundleId) continue
      const events = await resolveBundleToEvents(bundleId)
      const match = events.find((e) => e.eventId === eventId)
      if (match) {
        foundBundleId = bundleId
        foundBundleName = (d.bundleName as string) ?? null
        foundHasAccommodation = Boolean(d.hasAccommodation)
        eventName = match.eventName
        break
      }
    }

    if (!foundBundleId || !eventName) {
      return NextResponse.json(
        { error: 'No pack you purchased includes this event, or event not found' },
        { status: 400 }
      )
    }

    const eventSnap = await db.collection('events').doc(eventId).get()
    const eventData = eventSnap.data()
    const isTeamEvent = Boolean(eventData?.isTeamEvent)
    const eventNameFromDoc = (eventData?.name as string) ?? eventName

    const userSnap = await db.collection('vercera_5_participants').doc(userId).get()
    const verceraId = userSnap.exists ? (userSnap.data() as { verceraId?: string }).verceraId ?? null : null
    const nowIso = new Date().toISOString()
    const registrationDate = nowIso.split('T')[0]

    await db.collection('registrations').add({
      userId,
      verceraId,
      eventId,
      eventName: eventNameFromDoc,
      amount: 0,
      registrationDate,
      status: 'paid',
      attended: false,
      bundleId: foundBundleId,
      bundleName: foundBundleName,
      hasAccommodation: foundHasAccommodation,
      isTeamEvent,
      fromPack: true,
      createdAt: nowIso,
    })

    return NextResponse.json({ success: true, eventId, eventName: eventNameFromDoc })
  } catch (err) {
    console.error('add-from-pack error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add event' },
      { status: 500 }
    )
  }
}
