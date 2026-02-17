import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { generateVerceraId } from '@/lib/vercera-id'

function getVerceraFirestore() {
  const appName = 'vercera-firestore'
  if (getApps().some((app) => app.name === appName)) {
    return getFirestore(getApps().find((a) => a.name === appName)!)
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
  return getFirestore(getApps().find((a) => a.name === appName)!)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    // Check if user already has a verceraId
    const userDoc = await db.collection('vercera_5_participants').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (userData?.verceraId) {
      return NextResponse.json({ verceraId: userData.verceraId, message: 'Vercera ID already exists' })
    }

    // Generate unique Vercera ID
    let verceraId = generateVerceraId()
    let isUnique = false
    let attempts = 0
    const maxAttempts = 20

    while (!isUnique && attempts < maxAttempts) {
      const checkQuery = await db.collection('vercera_5_participants').where('verceraId', '==', verceraId).limit(1).get()
      if (checkQuery.empty) {
        isUnique = true
      } else {
        verceraId = generateVerceraId()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique Vercera ID. Please try again.' }, { status: 500 })
    }

    // Update user document with verceraId
    await db.collection('vercera_5_participants').doc(userId).update({
      verceraId,
      verceraIdGeneratedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, verceraId })
  } catch (err) {
    console.error('Generate Vercera ID error:', err)
    return NextResponse.json({ error: 'Failed to generate Vercera ID' }, { status: 500 })
  }
}
