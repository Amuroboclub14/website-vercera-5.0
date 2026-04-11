import { getVerceraFirestore } from '@/lib/firebase-admin'
import type { BundleRecord } from '@/lib/bundles-types'
import { readExcludedFromAllBundles } from '@/lib/event-bundle-flags'

export type ResolvedBundleItem = { eventId: string; eventName: string }

/** Resolve a bundle to the list of event IDs and names (for creating registrations). */
export async function resolveBundleToEvents(bundleId: string): Promise<ResolvedBundleItem[]> {
  const db = getVerceraFirestore()
  const bundleSnap = await db.collection('bundles').doc(bundleId).get()
  if (!bundleSnap.exists) return []

  const b = bundleSnap.data() as Record<string, unknown>
  const type = b.type as BundleRecord['type']
  const eventIds = (Array.isArray(b.eventIds) ? b.eventIds : []) as string[]

  const eventsSnap = await db.collection('events').get()
  const events = eventsSnap.docs.map((doc) => {
    const d = doc.data() as {
      name?: string
      category?: string
      excludedFromBundles?: boolean
      excludedFromTechnicalBundle?: boolean
      order?: number
    }
    return {
      id: doc.id,
      name: d.name ?? '',
      category: d.category,
      excludedFromAllBundles: readExcludedFromAllBundles(d),
      order: d.order ?? 999,
    }
  })

  const sortAndMap = (list: typeof events) =>
    list
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map((e) => ({ eventId: e.id, eventName: e.name ?? '' }))

  if (type === 'all_events' || type === 'all_in_one') {
    return sortAndMap(events.filter((e) => !e.excludedFromAllBundles))
  }

  if (type === 'all_technical') {
    return sortAndMap(
      events.filter((e) => e.category === 'technical' && !e.excludedFromAllBundles)
    )
  }

  if (type === 'non_technical' || type === 'gaming_all') {
    if (eventIds.length === 0) return []
    const idSet = new Set(eventIds)
    return sortAndMap(
      events.filter((e) => idSet.has(e.id) && !e.excludedFromAllBundles)
    )
  }

  return []
}

/** Get bundle doc for price and display. */
export async function getBundle(bundleId: string): Promise<BundleRecord | null> {
  const db = getVerceraFirestore()
  const snap = await db.collection('bundles').doc(bundleId).get()
  if (!snap.exists) return null
  const d = snap.data()!
  return {
    id: snap.id,
    name: d.name ?? '',
    type: (d.type as BundleRecord['type']) ?? 'all_events',
    price: Number(d.price) ?? 0,
    originalPrice: d.originalPrice != null ? Number(d.originalPrice) : undefined,
    eventIds: Array.isArray(d.eventIds) ? d.eventIds : [],
    description: d.description ?? undefined,
    order: d.order != null ? Number(d.order) : undefined,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}
