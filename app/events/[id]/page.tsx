'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { events } from '@/lib/events'
import { ArrowLeft, Clock, MapPin, Users, Trophy, Check } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function EventDetailPage({ params }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = use(params)
  const event = events.find((e) => e.id === id)
  const [isRegistering, setIsRegistering] = useState(false)

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">Event Not Found</h1>
            <p className="text-foreground/70 mb-8">The event you're looking for doesn't exist.</p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all"
            >
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const registrationPercentage = (event.registeredCount / event.maxParticipants) * 100
  const spotsAvailable = event.maxParticipants - event.registeredCount

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/events/${event.id}`)
    } else {
      router.push(`/checkout/${event.id}`)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-8 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                      {event.name}
                    </h1>
                    <p className="text-foreground/70 text-lg mt-2">{event.description}</p>
                  </div>
                  <span className="px-4 py-2 bg-accent/10 text-accent rounded-full font-semibold text-sm flex-shrink-0 border border-accent/30">
                    {event.category === 'technical' ? 'Technical' : 'Non-Technical'}
                  </span>
                </div>
              </div>

              {/* Event Image */}
              <div className="w-full h-96 bg-secondary rounded-xl flex items-center justify-center text-7xl border border-border">
                {event.category === 'technical' ? '⚙️' : '🎮'}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Date & Time</span>
                  </div>
                  <p className="font-semibold text-foreground">{event.date}</p>
                  <p className="text-foreground/60 text-sm">{event.time}</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Venue</span>
                  </div>
                  <p className="font-semibold text-foreground">{event.venue}</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Prize Pool</span>
                  </div>
                  <p className="font-semibold text-foreground">₹{(event.prizePool / 100000).toFixed(1)}L</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Registrations</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {event.registeredCount}/{event.maxParticipants}
                  </p>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">About this Event</h2>
                <p className="text-foreground/70 leading-relaxed">{event.longDescription}</p>
              </div>

              {/* Rules Section */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">Rules & Guidelines</h2>
                <ul className="space-y-3">
                  {event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check size={20} className="text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/70">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prize Breakdown */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">Prize Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {event.prizes.map((prize, index) => (
                    <div key={index} className="bg-secondary border border-border rounded-lg p-6">
                      <p className="text-foreground/60 text-sm mb-2">{prize.position}</p>
                      <p className="font-display text-3xl font-bold text-accent">₹{(prize.amount / 100000).toFixed(1)}L</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Registration Card */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
                {/* Price Section */}
                <div className="space-y-2">
                  <p className="text-foreground/60 text-sm">Registration Fee</p>
                  <p className="font-display text-4xl font-bold text-accent">₹{event.registrationFee}</p>
                </div>

                {/* Registration Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60 text-sm">Spots Available</span>
                    <span className="font-semibold text-foreground">{spotsAvailable} left</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-accent h-3 rounded-full transition-all"
                      style={{ width: `${registrationPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-foreground/60 text-xs">
                    {event.registeredCount}/{event.maxParticipants} registered
                  </p>
                </div>

                {/* CTA Button */}
                {spotsAvailable > 0 ? (
                  <button
                    onClick={handleRegisterClick}
                    disabled={isRegistering}
                    className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Processing...' : 'Register Now'}
                  </button>
                ) : (
                  <button disabled className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-bold cursor-not-allowed">
                    Registration Closed
                  </button>
                )}

                {/* Info Message */}
                <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                  <p className="text-foreground/80">
                    <span className="font-semibold">Note:</span> You need to be logged in to register for this event.
                  </p>
                  <p className="text-foreground/60">
                    After registration, you'll proceed to secure payment via Razorpay.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border"></div>

                {/* Additional Info */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-foreground/60 mb-1">Event Timing</p>
                    <p className="font-semibold text-foreground">{event.time}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 mb-1">Team Size</p>
                    <p className="font-semibold text-foreground">Check rules above</p>
                  </div>
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
