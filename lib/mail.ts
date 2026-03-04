import nodemailer from 'nodemailer'

const FROM = process.env.MAIL_FROM ?? process.env.SMTP_USER ?? 'noreply@example.com'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  return nodemailer.createTransport({
    host,
    port: Number.isNaN(port) ? 587 : port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export interface MailAttachment {
  filename: string
  content: Buffer
  cid?: string
}

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: MailAttachment[]
}

/** Send an email. No-op (and returns false) if SMTP is not configured. */
export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[mail] SMTP not configured (SMTP_HOST/USER/PASS). Skipping send.', options.subject, '->', options.to)
    }
    return false
  }
  try {
    const mailOptions: Parameters<typeof transporter.sendMail>[0] = {
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }
    if (options.attachments?.length) {
      mailOptions.attachments = options.attachments.map((a) =>
        a.cid ? { filename: a.filename, content: a.content, cid: a.cid } : { filename: a.filename, content: a.content }
      )
    }
    await transporter.sendMail(mailOptions)
    return true
  } catch (err) {
    console.error('[mail] Send failed:', err)
    return false
  }
}

export interface PaymentReceiptParams {
  to: string
  fullName: string
  orderId: string
  date: string
  items: { name: string; amount: number }[]
  totalAmount: number
}

/** Send payment receipt email. Fire-and-forget; does not throw. */
export async function sendPaymentReceipt(params: PaymentReceiptParams): Promise<boolean> {
  const { paymentReceiptEmailHtml } = await import('@/lib/email-templates')
  const html = paymentReceiptEmailHtml(params)
  const sent = await sendMail({
    to: params.to,
    subject: `Payment Receipt — Order ${params.orderId} — Vercera 5.0`,
    html,
  })
  return sent
}
