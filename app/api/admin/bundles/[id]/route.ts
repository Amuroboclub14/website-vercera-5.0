import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'
import type { BundleRecord, BundleType } from '@/lib/bundles-types'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const

/** GET: Single bundle. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const doc = await db.collection('bundles').doc(id).get()
    if (!doc.exists) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    const d = doc.data()!
    const bundle: BundleRecord = {
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
    return NextResponse.json(bundle)
  } catch (err) {
    console.error('Admin get bundle error:', err)
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
  }
}

/** PUT: Update bundle. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    const body = await request.json()
    const { name, type, price, originalPrice, eventIds, description, order } = body
    const db = getVerceraFirestore()
    const ref = db.collection('bundles').doc(id)
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    const now = new Date().toISOString()
    const data: Record<string, unknown> = { updatedAt: now }
    if (name !== undefined) data.name = String(name)
    if (type !== undefined) data.type = type
    if (price !== undefined) data.price = Number(price) ?? 0
    if (originalPrice !== undefined) data.originalPrice = originalPrice == null ? null : Number(originalPrice)
    if (eventIds !== undefined) data.eventIds = Array.isArray(eventIds) ? eventIds : []
    if (description !== undefined) data.description = String(description)
    if (order !== undefined) data.order = Number(order) ?? 0

    await ref.update(data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin update bundle error:', err)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}

/** DELETE: Delete bundle. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const ref = db.collection('bundles').doc(id)
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin delete bundle error:', err)
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 })
  }
}
