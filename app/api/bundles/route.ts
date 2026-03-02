import { NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import type { BundleType } from '@/lib/bundles-types'

export const dynamic = 'force-dynamic'

export interface PublicBundle {
  id: string
  name: string
  type: BundleType
  price: number
  originalPrice?: number
  description?: string
}

/** GET: Public list of all bundles for display on Packs page. */
export async function GET() {
  try {
    const db = getVerceraFirestore()
    const snap = await db.collection('bundles').get()
    const withOrder = snap.docs.map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        name: d.name ?? '',
        type: (d.type as BundleType) ?? 'all_events',
        price: Number(d.price) ?? 0,
        originalPrice: d.originalPrice != null ? Number(d.originalPrice) : undefined,
        description: d.description ?? undefined,
        order: d.order != null ? Number(d.order) : 999,
      }
    })
    withOrder.sort((a, b) => a.order - b.order)
    const bundles: PublicBundle[] = withOrder.map(({ order: _o, ...b }) => b)
    return NextResponse.json({ bundles })
  } catch (err) {
    console.error('List bundles error:', err)
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}
