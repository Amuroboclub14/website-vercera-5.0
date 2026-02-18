import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { isValidVerceraId } from '@/lib/vercera-id'

function getVerceraFirestore() {
  const appName = 'vercera-firestore'
  if (getApps().some((app) => app.name === appName)) {
    return getFirestore(getApps().find((a) => a.name === appName)!)
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  let serviceAccount: ServiceAccount
  if (path) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
    const { verceraId } = body as { verceraId?: string }

    if (!verceraId) {
      return NextResponse.json({ error: 'Vercera ID is required' }, { status: 400 })
    }

    if (!isValidVerceraId(verceraId)) {
      return NextResponse.json({ error: 'Invalid Vercera ID format' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    const snapshot = await db
      .collection('vercera_5_participants')
      .where('verceraId', '==', verceraId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const doc = snapshot.docs[0]
    const data = doc.data()

    return NextResponse.json({
      success: true,
      user: {
        userId: doc.id,
        verceraId: data.verceraId,
        fullName: data.fullName,
        email: data.email,
        whatsappNumber: data.whatsappNumber,
        department: data.department,
        yearOfStudy: data.yearOfStudy,
        collegeName: data.collegeName,
      },
    })
  } catch (err) {
    console.error('lookup-by-vercera-id error:', err)
    return NextResponse.json({ error: 'Failed to lookup participant' }, { status: 500 })
  }
}

