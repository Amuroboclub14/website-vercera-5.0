import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAdminUids } from '@/lib/firebase-admin'

function getFirebaseAdminAuth() {
  const appName = 'vercera-admin-auth'
  if (getApps().some((app) => app.name === appName)) {
    return getAuth(getApps().find((a) => a.name === appName)!)
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  let serviceAccount: ServiceAccount
  if (path) {
    serviceAccount = require(path) as ServiceAccount
  } else if (json) {
    serviceAccount = JSON.parse(json) as ServiceAccount
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH not configured')
  }
  initializeApp({ credential: cert(serviceAccount) }, appName)
  return getAuth(getApps().find((a) => a.name === appName)!)
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 401 })
    }
    const auth = getFirebaseAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    const uids = getAdminUids()
    if (!uids.length || !uids.includes(decoded.uid)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ ok: true, uid: decoded.uid })
  } catch (err) {
    console.error('Admin check error:', err)
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
}
