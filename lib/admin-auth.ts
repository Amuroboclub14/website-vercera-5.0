import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getVerceraFirestore, getOwnerUid } from '@/lib/firebase-admin'

export type AdminLevel = 'owner' | 'super_admin' | 'event_admin'

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

/** Bootstrap owner UID from env. Only this user can assign the Owner role to others. */
export function getBootstrapOwnerUid(): string | null {
  return getOwnerUid()
}

/** Resolve admin level: bootstrap owner from env, or owner/super_admin/event_admin from Firestore admin_roles. */
export async function getAdminLevel(uid: string): Promise<AdminLevel | null> {
  if (getOwnerUid() === uid) return 'owner'
  const db = getVerceraFirestore()
  const doc = await db.collection('admin_roles').doc(uid).get()
  const role = doc.data()?.role
  if (role === 'owner' || role === 'super_admin' || role === 'event_admin') return role
  return null
}

/** Returns { uid, level } if request has valid admin token; otherwise null. */
export async function verifyAdminWithLevel(
  request: NextRequest
): Promise<{ uid: string; level: AdminLevel } | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return null
    const auth = getFirebaseAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    const level = await getAdminLevel(decoded.uid)
    if (!level) return null
    return { uid: decoded.uid, level }
  } catch {
    return null
  }
}

/** Returns decoded uid if request has valid admin token (any level); otherwise null. */
export async function verifyAdminToken(request: NextRequest): Promise<string | null> {
  const result = await verifyAdminWithLevel(request)
  return result ? result.uid : null
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/** Verify admin and require one of the allowed levels. Returns { uid, level } or sends 401/403. */
export async function requireAdminLevel(
  request: NextRequest,
  allowed: AdminLevel[]
): Promise<{ uid: string; level: AdminLevel } | NextResponse> {
  const result = await verifyAdminWithLevel(request)
  if (!result) return unauthorizedResponse()
  if (!allowed.includes(result.level)) return forbiddenResponse()
  return result
}
