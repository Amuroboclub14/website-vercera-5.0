'use client'

import { use, useEffect, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { events } from '@/lib/events'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  params: Promise<{ eventId: string }>
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  prefill?: { name?: string; email?: string }
  theme?: { color: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
}

export default function CheckoutPage({ params }: Props) {
  const router = useRouter()
  const { eventId } = use(params)
  const event = events.find((e) => e.id === eventId)
  const { user, profile, loading } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle')
  const [formData, setFormData] = useState({
    teamName: '',
    memberEmails: '',
    additionalInfo: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/checkout/${eventId}`)
    }
  }, [user, loading, router, eventId])

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Event Not Found</h1>
            <Link href="/events" className="text-accent hover:text-accent/80">
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const totalAmount = Math.round(event.registrationFee * 1.18)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !event || !razorpayLoaded) return

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (!keyId) {
      setPaymentStatus('failed')
      return
    }

    setIsLoading(true)
    setPaymentStatus('processing')

    try {
      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          eventId: event.id,
          eventName: event.name,
          email: profile.email,
          userId: user.uid,
        }),
      })

      if (!createRes.ok) {
        const err = await createRes.json()
        throw new Error(err.error || 'Failed to create order')
      }

      const order = await createRes.json()

      const options: RazorpayOptions = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vercera 5.0',
        description: `Registration for ${event.name}`,
        order_id: order.id,
        prefill: {
          name: profile.fullName,
          email: profile.email,
        },
        theme: { color: '#d41f3d' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                eventId: event.id,
                eventName: event.name,
                amount: totalAmount,
                userId: user.uid,
                teamName: formData.teamName || null,
                memberEmails: formData.memberEmails || null,
                additionalInfo: formData.additionalInfo || null,
              }),
            })

            if (verifyRes.ok) {
              setPaymentStatus('success')
              setTimeout(() => router.push('/dashboard'), 2000)
            } else {
              setPaymentStatus('failed')
              setIsLoading(false)
            }
          } catch {
            setPaymentStatus('failed')
            setIsLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
            setPaymentStatus('idle')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentStatus('failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            Back to Event
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Complete Your Registration</h1>
                <p className="text-foreground/70 mb-8">Fill in your details and proceed to payment</p>

                {paymentStatus === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <CheckCircle size={32} className="text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">Payment Successful!</h2>
                    <p className="text-foreground/70 text-center">
                      You have successfully registered for {event.name}. Redirecting to your dashboard...
                    </p>
                  </div>
                ) : paymentStatus === 'failed' ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-destructive/20 border border-destructive rounded-lg">
                      <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive">Payment Failed</p>
                        <p className="text-destructive/80 text-sm">Please try again or contact support.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentStatus('idle')}
                      className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePayment} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="teamName" className="block text-sm font-medium text-foreground">
                        Team Name (if applicable)
                      </label>
                      <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        value={formData.teamName}
                        onChange={handleInputChange}
                        placeholder="Team Name"
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="memberEmails" className="block text-sm font-medium text-foreground">
                        Team Member Emails (comma-separated)
                      </label>
                      <textarea
                        id="memberEmails"
                        name="memberEmails"
                        value={formData.memberEmails}
                        onChange={handleInputChange}
                        placeholder="member1@email.com, member2@email.com"
                        rows={3}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-foreground">
                        Additional Information
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="Any additional details..."
                        rows={3}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agree"
                          defaultChecked
                          className="mt-1 accent-accent"
                          disabled={isLoading}
                        />
                        <label htmlFor="agree" className="text-sm text-foreground/70">
                          I agree to the event terms and conditions. Non-refundable after payment.
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !razorpayLoaded}
                      className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Opening Payment...' : !razorpayLoaded ? 'Loading...' : `Pay ₹${totalAmount} & Register`}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24 space-y-6">
                <h2 className="font-display text-xl font-bold text-foreground">Order Summary</h2>

                <div className="space-y-3">
                  <div>
                    <p className="text-foreground/60 text-sm">Event</p>
                    <p className="font-semibold text-foreground">{event.name}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm">Participant</p>
                    <p className="font-semibold text-foreground">{profile.fullName}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm">Email</p>
                    <p className="font-semibold text-foreground text-sm break-all">{profile.email}</p>
                  </div>
                </div>

                <div className="border-t border-border"></div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">Registration Fee</span>
                    <span className="font-semibold text-foreground">₹{event.registrationFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">GST (18%)</span>
                    <span className="font-semibold text-foreground">₹{Math.round(event.registrationFee * 0.18)}</span>
                  </div>
                </div>

                <div className="border-t border-border"></div>

                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-foreground text-lg">Total</span>
                  <span className="font-display font-bold text-accent text-2xl">₹{totalAmount}</span>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="text-foreground/60 text-xs">Payment Method</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-lg">💳</span> Razorpay
                  </p>
                  <p className="text-foreground/70 text-xs">
                    Credit/Debit Cards, UPI, Net Banking, and Digital Wallets accepted
                  </p>
                </div>

                <div className="bg-accent/10 border border-accent rounded-lg p-4 text-sm text-foreground/80">
                  All payments are secured by Razorpay and encrypted with SSL technology.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
