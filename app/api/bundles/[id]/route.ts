import { NextRequest, NextResponse } from 'next/server'
import { getBundle } from '@/lib/resolve-bundle'

export const dynamic = 'force-dynamic'

/** GET: Public bundle details (name, price, originalPrice) for checkout display. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    const bundle = await getBundle(id)
    if (!bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    return NextResponse.json({
      id: bundle.id,
      name: bundle.name,
      type: bundle.type,
      price: bundle.price,
      originalPrice: bundle.originalPrice,
      description: bundle.description,
    })
  } catch (err) {
    console.error('Get bundle error:', err)
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
  }
}
