import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getAuthenticatedUserId, unauthorizedResponse } from '@/lib/admin-auth'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { sendMail } from '@/lib/mail'
import { registrationEmailHtml } from '@/lib/email-templates'

/**
 * POST /api/mail/send-registration-email
 * Sends the registration confirmation email (Vercera ID + QR code) to the authenticated user.
 * QR is embedded inline (cid) and attached as PNG. Call after signup or when a legacy user gets a Vercera ID.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return unauthorizedResponse()

  try {
    const db = getVerceraFirestore()
    const profileSnap = await db.collection('vercera_5_participants').doc(userId).get()
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const data = profileSnap.data() as { email?: string; fullName?: string; verceraId?: string }
    const email = data.email?.trim()
    const fullName = data.fullName?.trim() || 'Participant'
    const verceraId = data.verceraId

    if (!email) {
      return NextResponse.json({ error: 'No email on profile' }, { status: 400 })
    }
    if (!verceraId) {
      return NextResponse.json({ error: 'No Vercera ID on profile' }, { status: 400 })
    }

    const qrBuffer = await QRCode.toBuffer(verceraId, { type: 'png', width: 280, margin: 2 })
    const html = registrationEmailHtml({ fullName, verceraId })

    const sent = await sendMail({
      to: email,
      subject: 'Your Vercera 5.0 Registration — Vercera ID & QR Code',
      html,
      text: `Welcome to Vercera 5.0. Your Vercera ID: ${verceraId}. Present this ID (or the attached QR code) at the venue for check-in.`,
      attachments: [
        { filename: 'qrcode.png', content: qrBuffer, cid: 'vercera-qr' },
        { filename: 'Vercera-QR-Code.png', content: qrBuffer },
      ],
    })

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Registration email sent' })
  } catch (err) {
    console.error('Send registration email error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 }
    )
  }
}
