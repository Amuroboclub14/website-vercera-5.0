import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'
import type { BundleRecord, BundleType } from '@/lib/bundles-types'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

/** GET: List all bundles. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const db = getVerceraFirestore()
    const snap = await db.collection('bundles').get()
    const bundles: BundleRecord[] = snap.docs
      .map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        name: d.name ?? '',
        type: (d.type as BundleType) ?? 'all_events',
        price: Number(d.price) ?? 0,
        originalPrice: d.originalPrice != null ? Number(d.originalPrice) : undefined,
        eventIds: Array.isArray(d.eventIds) ? d.eventIds : [],
        description: d.description ?? undefined,
        order: d.order != null ? Number(d.order) : undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    return NextResponse.json({ bundles })
  } catch (err) {
    console.error('Admin bundles list error:', err)
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}

/** POST: Create bundle. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const body = await request.json()
    const { name, type, price, originalPrice, eventIds, description, order } = body
    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }
    const validTypes: BundleType[] = ['all_in_one', 'all_events', 'all_technical', 'non_technical', 'gaming_all']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid bundle type' }, { status: 400 })
    }
    const now = new Date().toISOString()
    const data: Record<string, unknown> = {
      name: String(name),
      type,
      price: Number(price) ?? 0,
      order: order != null ? Number(order) : 0,
      createdAt: now,
      updatedAt: now,
    }
    if (originalPrice != null) data.originalPrice = Number(originalPrice)
    if (Array.isArray(eventIds)) data.eventIds = eventIds
    if (description != null) data.description = String(description)

    const db = getVerceraFirestore()
    const ref = await db.collection('bundles').add(data)
    return NextResponse.json({ id: ref.id, ...data })
  } catch (err) {
    console.error('Admin create bundle error:', err)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
