'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { useMyRegistrations } from '@/hooks/use-my-registrations'
import { ArrowLeft, AlertCircle, CheckCircle, BadgeCheck, Pin } from 'lucide-react'

interface Props {
  params: Promise<{ bundleId: string }>
}

type BundleInfo = {
  id: string
  name: string
  type: string
  price: number
  originalPrice?: number
  description?: string
}

export default function BundleCheckoutPage({ params }: Props) {
  const router = useRouter()
  const { bundleId } = use(params)
  const { user, profile, loading } = useAuth()
  const { purchasedBundleIds } = useMyRegistrations()
  const [bundle, setBundle] = useState<BundleInfo | null>(null)
  const [bundleLoading, setBundleLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  const [formData, setFormData] = useState({ additionalInfo: '' })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/checkout/bundle/${bundleId}`)
    }
  }, [user, loading, router, bundleId])

  useEffect(() => {
    fetch(`/api/bundles/${bundleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBundle(data)
      })
      .catch(() => setBundle(null))
      .finally(() => setBundleLoading(false))
  }, [bundleId])

  const alreadyPurchased = !!(user && bundle && purchasedBundleIds.has(bundle.id))

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !bundle || alreadyPurchased) return

    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard?payment=success` : 'https://www.vercera.in/dashboard?payment=success'

    setIsLoading(true)
    try {
      const token = await user.getIdToken()
      const sessionRes = await fetch('/api/ev/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bundleId: bundle.id,
          returnUrl,
          additionalInfo: formData.additionalInfo?.trim() || null,
        }),
      })
      const sessionData = await sessionRes.json().catch(() => ({}))
      if (!sessionRes.ok || !sessionData.checkoutId || !sessionData.checkoutUrl) {
        throw new Error(sessionData.error || 'Failed to initialize checkout')
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = String(sessionData.checkoutUrl)
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'checkoutId'
      input.value = String(sessionData.checkoutId)
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error('Bundle checkout init failed:', error)
      setIsLoading(false)
    }
  }

  if (bundleLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-foreground/60">Loading pack…</div>
        <Footer />
      </main>
    )
  }

  if (!bundle) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Pack not found</h1>
            <Link href="/packs" className="text-accent hover:text-accent/80">
              Back to Packs
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
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
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/packs"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            Back to Packs
          </Link>

          {/* Pinned notice: add events to profile after payment */}
          {!alreadyPurchased && paymentStatus !== 'success' && paymentStatus !== 'failed' && (
            <div className="mb-6 rounded-xl border-2 border-accent/50 bg-accent/10 p-4 flex gap-3">
              <Pin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-foreground/90">
                <strong className="text-foreground">After payment</strong>, go to <strong className="text-accent">Events</strong> or <strong className="text-accent">Dashboard</strong> to <strong className="text-foreground">add events to your profile</strong> from this pack. You don&apos;t need to add them all at once — you can add them later as well.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-8">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">Complete your pack registration</h1>
                <p className="text-foreground/70 mb-8">Proceed to payment for {bundle.name}</p>

                {paymentStatus === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <CheckCircle size={32} className="text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">Payment successful!</h2>
                    <p className="text-foreground/70 text-center">
                      You have registered for {bundle.name}. Redirecting to your dashboard…
                    </p>
                  </div>
                ) : paymentStatus === 'failed' ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-destructive/20 border border-destructive rounded-lg">
                      <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-destructive">Payment failed</p>
                        <p className="text-destructive/80 text-sm">Please try again or contact support.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('idle')}
                      className="px-6 py-2 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90"
                    >
                      Try again
                    </button>
                  </div>
                ) : alreadyPurchased ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <BadgeCheck size={32} className="text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">You already own this pack</h2>
                    <p className="text-foreground/70 text-center max-w-md">
                      You have already purchased {bundle.name}. View your registrations in the dashboard.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link
                        href="/dashboard"
                        className="px-6 py-2.5 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/packs"
                        className="px-6 py-2.5 bg-secondary text-foreground rounded-full font-medium hover:bg-secondary/80 transition-colors"
                      >
                        Back to packs
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePayment} className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-foreground">
                        Additional information (optional)
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                        placeholder="Any additional details…"
                        rows={3}
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="agree" defaultChecked className="mt-1 accent-accent" disabled={isLoading} />
                        <label htmlFor="agree" className="text-sm text-foreground/70">
                          I agree to the terms. Payment is non-refundable.
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-full font-bold text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Redirecting to payment…' : `Pay ₹${bundle.price.toLocaleString('en-IN')} & register`}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24 space-y-6">
                <h2 className="font-display text-xl font-bold text-foreground">Order summary</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-foreground/60 text-sm">Pack</p>
                    <p className="font-semibold text-foreground">{bundle.name}</p>
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
                <div className="border-t border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Total</span>
                  <span className="font-display font-bold text-accent text-2xl">
                    ₹{bundle.price.toLocaleString('en-IN')}
                  </span>
                </div>
                {bundle.originalPrice != null && bundle.originalPrice > bundle.price && (
                  <p className="text-sm text-foreground/60">
                    <span className="line-through">₹{bundle.originalPrice.toLocaleString('en-IN')}</span> — discounted
                  </p>
                )}
                <div className="bg-accent/10 border border-accent rounded-lg p-4 text-sm text-foreground/80">
                  Payments are secured by Razorpay.
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
