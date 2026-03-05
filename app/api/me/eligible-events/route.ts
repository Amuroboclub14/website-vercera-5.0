import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { resolveBundleToEvents } from '@/lib/resolve-bundle'

export interface EligibleEvent {
  eventId: string
  eventName: string
  bundleId: string
  bundleName: string | null
}

/**
 * GET /api/me/eligible-events
 * Returns events the user can add to their profile from packs they've purchased (not yet added).
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const db = getVerceraFirestore()

    const [packTxSnap, regsSnap] = await Promise.all([
      db.collection('transactions').where('userId', '==', userId).where('type', '==', 'pack').get(),
      db.collection('registrations').where('userId', '==', userId).get(),
    ])

    const registeredEventIds = new Set(regsSnap.docs.map((d) => (d.data() as { eventId?: string }).eventId).filter(Boolean))

    const eligible: EligibleEvent[] = []
    const seen = new Set<string>()

    for (const doc of packTxSnap.docs) {
      const d = doc.data()
      const bundleId = d.bundleId as string
      const bundleName = (d.bundleName as string) ?? null
      if (!bundleId) continue
      const events = await resolveBundleToEvents(bundleId)
      for (const e of events) {
        if (registeredEventIds.has(e.eventId) || seen.has(e.eventId)) continue
        seen.add(e.eventId)
        eligible.push({ eventId: e.eventId, eventName: e.eventName, bundleId, bundleName })
      }
    }

    return NextResponse.json({ eligible })
  } catch (err) {
    console.error('eligible-events error:', err)
    return NextResponse.json({ error: 'Failed to fetch eligible events' }, { status: 500 })
  }
}
