import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { isValidVerceraId } from '@/lib/vercera-id'
import { requireAdminLevel } from '@/lib/admin-auth'

const ALLOWED_LEVELS = ['owner', 'super_admin', 'event_admin'] as const

export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid
  try {
    const body = await request.json()
    const { verceraId } = body

    if (!verceraId) {
      return NextResponse.json({ error: 'Vercera ID is required' }, { status: 400 })
    }

    if (!isValidVerceraId(verceraId)) {
      return NextResponse.json({ error: 'Invalid Vercera ID format' }, { status: 400 })
    }

    const db = getVerceraFirestore()

    // Find participant by verceraId
    const participantsSnapshot = await db.collection('vercera_5_participants').where('verceraId', '==', verceraId).limit(1).get()

    if (participantsSnapshot.empty) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const participantDoc = participantsSnapshot.docs[0]
    const participantData = participantDoc.data()
    const userId = participantDoc.id

    // Get all registrations for this participant
    const registrationsSnapshot = await db.collection('registrations').where('userId', '==', userId).get()

    const registrations = registrationsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        eventId: data.eventId,
        eventName: data.eventName,
        registrationDate: data.registrationDate,
        status: data.status,
        amount: data.amount,
        attended: data.attended || false,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      participant: {
        verceraId: participantData.verceraId,
        fullName: participantData.fullName,
        email: participantData.email,
        whatsappNumber: participantData.whatsappNumber,
        collegeName: participantData.collegeName,
        courseOfStudy: participantData.courseOfStudy,
        department: participantData.department,
        yearOfStudy: participantData.yearOfStudy,
      },
      registrations,
    })
  } catch (err) {
    console.error('Scan participant error:', err)
    return NextResponse.json({ error: 'Failed to scan participant' }, { status: 500 })
  }
}
