import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const uid = await verifyAdminToken(request)
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ ok: true, uid })
  } catch (err) {
    console.error('Admin check error:', err)
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
}
