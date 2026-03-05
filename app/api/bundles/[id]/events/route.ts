import { NextRequest, NextResponse } from 'next/server'
import { resolveBundleToEvents } from '@/lib/resolve-bundle'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bundles/[id]/events
 * Returns the list of events included in this bundle (for pack modal).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bundleId } = await params
    if (!bundleId) return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 })
    const events = await resolveBundleToEvents(bundleId)
    return NextResponse.json({ events })
  } catch (err) {
    console.error('Bundle events error:', err)
    return NextResponse.json({ error: 'Failed to fetch bundle events' }, { status: 500 })
  }
}
