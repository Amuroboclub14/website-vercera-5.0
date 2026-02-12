import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Verifies AMURoboclub membership by querying members_2025 in the AMURoboclub Firebase project.
 * This allows Vercera 5.0 to use its OWN Firebase project for Auth/Firestore while
 * still verifying against members_2025 in the AMURoboclub project.
 */

function getAMURoboclubFirestore() {
  const serviceAccountJson = process.env.FIREBASE_AMUROBOCLUB_SERVICE_ACCOUNT
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_AMUROBOCLUB_SERVICE_ACCOUNT not configured. Add the AMURoboclub project service account JSON string to verify members.'
    )
  }

  const appName = 'amuroboclub-verification'
  if (getApps().some((app) => app.name === appName)) {
    return getFirestore(getApps().find((a) => a.name === appName)!)
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount
  const app = initializeApp(
    { credential: cert(serviceAccount) },
    appName
  )
  return getFirestore(app)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { enrollmentNumber, facultyNumber, mobile, email } = body

    if (!enrollmentNumber || !facultyNumber || !mobile || !email) {
      return NextResponse.json(
        { verified: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = getAMURoboclubFirestore()
    const snapshot = await db
      .collection('members_2025')
      .where('enrollmentNumber', '==', String(enrollmentNumber).trim())
      .where('facultyNumber', '==', String(facultyNumber).trim())
      .where('mobile', '==', String(mobile).trim())
      .where('email', '==', String(email).trim().toLowerCase())
      .get()

    if (snapshot.empty) {
      return NextResponse.json({
        verified: false,
        error: 'No matching membership found. Please ensure you entered the same details used for membership purchase.',
      })
    }

    const memberData = snapshot.docs[0].data()
    if (!memberData.paymentStatus) {
      return NextResponse.json({
        verified: false,
        error: 'Membership payment is not complete. Please complete your membership payment first.',
      })
    }

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('Member verification error:', err)
    return NextResponse.json(
      { verified: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
