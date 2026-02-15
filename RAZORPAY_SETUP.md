# Razorpay Integration Setup Guide

This guide will help you set up Razorpay payment integration for Vercera 5.0.

## Overview

Vercera 5.0 is configured to accept payments through Razorpay, India's leading payment gateway. Users must be logged in to register and pay for events.

## Step 1: Create a Razorpay Account

1. Go to [Razorpay](https://razorpay.com/)
2. Sign up for a business account
3. Complete KYC verification
4. Go to Settings → API Keys
5. Copy your **Key ID** and **Key Secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in the project root (or add to existing `.env.local`):

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx

# Firebase Admin - Vercera project (required for verify-payment to save registrations)
# Get from Vercera Firebase: Settings > Service accounts > Generate new private key
# Paste the full JSON as a single-line string
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Note:** 
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is publicly visible (safe to expose)
- `RAZORPAY_KEY_SECRET` must be kept secret and only used server-side
- For development, use Razorpay's **test** credentials (`rzp_test_...`)
- `FIREBASE_SERVICE_ACCOUNT` must be from your Vercera Firebase project (where `registrations` are stored)

## Step 3: Server-Side Payment Implementation

Replace the mock payment logic in `/app/checkout/[eventId]/page.tsx` with real Razorpay integration:

### Option A: Using Razorpay Checkout (Recommended)

Create `/app/api/checkout/create-order.ts`:

```typescript
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { eventId, eventName, amount, email, name } = await request.json();

    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `event_${eventId}_${Date.now()}`,
      notes: {
        event_id: eventId,
        event_name: eventName,
        participant_email: email,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

Create `/app/api/checkout/verify-payment.ts`:

```typescript
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await request.json();

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Payment verified successfully
    // Store registration in database here
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
```

### Option B: Using Razorpay Button

Update `/components/razorpay-button.tsx`:

```typescript
'use client';

import Script from 'next/script';

interface RazorpayButtonProps {
  eventId: string;
  eventName: string;
  amount: number;
  email: string;
  name: string;
  onSuccess: () => void;
  onError: () => void;
}

export function RazorpayButton({
  eventId,
  eventName,
  amount,
  email,
  name,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const handlePayment = async () => {
    // Create order
    const res = await fetch('/api/checkout/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        eventName,
        amount,
        email,
        name,
      }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Vercera 5.0',
      description: eventName,
      order_id: order.id,
      handler: async (response: any) => {
        // Verify payment
        const verifyRes = await fetch('/api/checkout/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        if (verifyRes.ok) {
          onSuccess();
        } else {
          onError();
        }
      },
      prefill: {
        name,
        email,
      },
      theme: {
        color: '#06b6d4',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <button
        onClick={handlePayment}
        className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors"
      >
        Pay ₹{amount} & Register
      </button>
    </>
  );
}
```

## Step 4: Database Integration

After payment verification, store the registration:

```typescript
// Example using Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// After payment verification
await supabase.from('registrations').insert({
  event_id: eventId,
  user_id: userId,
  payment_id: paymentId,
  amount: amount,
  status: 'completed',
  created_at: new Date(),
});
```

## Step 5: Test Payment Integration

### Test Credentials (Razorpay provides test mode)

**Test Card Numbers:**
- Visa: `4111111111111111`
- Mastercard: `5555555555554444`
- American Express: `378282246310005`

**Test OTP:** `123456`

### Testing Webhooks Locally

Use ngrok to expose local server to Razorpay:

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Expose to public
ngrok http 3000

# Use the ngrok URL in Razorpay webhook settings
```

## Step 6: Configure Webhook

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhook/razorpay`
3. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `refund.created`

Create `/app/api/webhook/razorpay.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature')!;

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Handle different webhook events
  switch (event.event) {
    case 'payment.authorized':
      // Update registration status
      break;
    case 'payment.failed':
      // Handle failed payment
      break;
    case 'refund.created':
      // Handle refund
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Step 7: Go Live Checklist

Before going live with real payments:

- [ ] Switch from test keys to live keys
- [ ] Implement proper error handling
- [ ] Add payment receipt emails
- [ ] Set up refund policy
- [ ] Test entire payment flow
- [ ] Implement payment tracking dashboard
- [ ] Set up customer support system
- [ ] Enable HTTPS everywhere
- [ ] Add fraud detection
- [ ] Monitor for failed payments
- [ ] Set up alerts for suspicious activity

## Payment Flow Summary

1. **User Registration** → Login/Signup required
2. **Event Selection** → Browse and select event
3. **Checkout** → Fill registration details
4. **Payment Processing** → Razorpay handles payment
5. **Verification** → Server verifies payment signature
6. **Confirmation** → Registration saved to database
7. **Dashboard** → User sees completed registration

## Troubleshooting

### Common Issues

**Issue:** "Invalid signature"
- Solution: Verify webhook secret is correct
- Check: Key ID and Secret match in .env

**Issue:** "Order not found"
- Solution: Ensure order was created successfully
- Check: API endpoint is working correctly

**Issue:** Payment gateway not loading
- Solution: Check Razorpay script is loading
- Verify: Public key is in NEXT_PUBLIC env variables

### Support

- Razorpay Support: https://razorpay.com/support
- Documentation: https://razorpay.com/docs
- Status Page: https://status.razorpay.com

## Additional Resources

- [Razorpay Integration Guide](https://razorpay.com/docs/api/payments/payment-links/)
- [Razorpay Orders API](https://razorpay.com/docs/orders/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Razorpay Test Credentials](https://razorpay.com/docs/payments/test-mode/)

## Production Checklist

- [ ] SSL certificate installed
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on server
- [ ] Logging and monitoring set up
- [ ] Backup and disaster recovery plan
- [ ] Support team trained
- [ ] Legal documents reviewed
