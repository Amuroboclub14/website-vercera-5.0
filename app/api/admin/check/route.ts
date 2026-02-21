import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminWithLevel, getBootstrapOwnerUid } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdminWithLevel(request)
    if (!result) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const bootstrapOwnerUid = getBootstrapOwnerUid()
    return NextResponse.json({
      ok: true,
      uid: result.uid,
      level: result.level,
      bootstrapOwnerUid: bootstrapOwnerUid ?? undefined,
    })
  } catch (err) {
    console.error('Admin check error:', err)
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
}
