import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'

/**
 * GET /api/me/summary
 * Returns total spent and purchased bundle IDs for the current user (from transactions).
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const db = getVerceraFirestore()
    const snap = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .get()

    let totalSpent = 0
    const purchasedBundleIds = new Set<string>()
    snap.docs.forEach((doc) => {
      const d = doc.data()
      totalSpent += Number(d.amount) || 0
      if (d.type === 'pack' && d.bundleId) purchasedBundleIds.add(d.bundleId)
    })

    return NextResponse.json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      purchasedBundleIds: Array.from(purchasedBundleIds),
    })
  } catch (err) {
    console.error('me/summary error:', err)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
