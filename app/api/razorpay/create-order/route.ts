import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

function getRazorpay() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, eventId, eventName, email, userId } = body

    if (!amount || !eventId || !eventName || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const amountInPaise = Math.round(Number(amount) * 100)

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `v5_${eventId}_${Date.now().toString(36)}`,
      notes: {
        event_id: eventId,
        event_name: eventName,
        user_id: userId,
        participant_email: email,
      },
    })

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err) {
    console.error('Razorpay create order error:', err)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
