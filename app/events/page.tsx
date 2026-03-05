'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { useEvents } from '@/hooks/use-events'
import { useMyRegistrations } from '@/hooks/use-my-registrations'
import { useAuth } from '@/contexts/auth-context'
import { EventsComingSoon } from '@/components/events-coming-soon'
import { ArrowLeft, Users, Trophy, Clock, MapPin, BadgeCheck, Package, X } from 'lucide-react'
import { formatPrizeAmount } from '@/lib/format-prize'

type Bundle = { id: string; name: string; type: string; price: number; originalPrice?: number; description?: string }
type PackEvent = { eventId: string; eventName: string }

export default function EventsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { events, loading, error, showComingSoon } = useEvents()
  const { registeredEventIds, purchasedBundleIds } = useMyRegistrations()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'non-technical'>('all')
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [eligibleEventIds, setEligibleEventIds] = useState<Set<string>>(new Set())
  const [packModal, setPackModal] = useState<Bundle | null>(null)
  const [packModalEvents, setPackModalEvents] = useState<PackEvent[]>([])
  const [addingEventId, setAddingEventId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/bundles')
      .then((r) => r.json())
      .then((d) => { if (d.bundles) setBundles(d.bundles) })
      .catch(() => setBundles([]))
  }, [])

  useEffect(() => {
    if (!user) {
      setEligibleEventIds(new Set())
      return
    }
    user.getIdToken().then((token) =>
      fetch('/api/me/eligible-events', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setEligibleEventIds(new Set((d.eligible ?? []).map((e: { eventId: string }) => e.eventId))))
        .catch(() => setEligibleEventIds(new Set()))
    )
  }, [user])

  useEffect(() => {
    if (!packModal) {
      setPackModalEvents([])
      return
    }
    fetch(`/api/bundles/${packModal.id}/events`)
      .then((r) => r.json())
      .then((d) => setPackModalEvents(d.events ?? []))
      .catch(() => setPackModalEvents([]))
  }, [packModal?.id])

  const handleAddFromPack = async (eventId: string) => {
    if (!user || addingEventId) return
    setAddingEventId(eventId)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/registration/add-from-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId }),
      })
      if (res.ok) {
        setEligibleEventIds((prev) => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to add event')
      }
    } catch {
      alert('Request failed')
    } finally {
      setAddingEventId(null)
    }
  }

  const filteredEvents =
    selectedCategory === 'all' ? events : events.filter((e) => e.category === selectedCategory)

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-foreground/60">Loading events…</div>
        <Footer />
      </main>
    )
  }

  if (!error && showComingSoon) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-8 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
          </div>
          <EventsComingSoon variant="page" showBackLink={false} />
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-6 font-medium"
              >
                <ArrowLeft size={18} />
                Back to Home
              </Link>
            </motion.div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-4">
              All Events
            </h1>
            <p className="text-foreground/70 text-lg">Explore our complete catalog of technical and non-technical events at Vercera 5.0</p>
          </motion.div>

          {/* Packs - prominent at top */}
          {bundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-10"
            >
              <h2 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-7 w-7 text-accent" />
                Packs &amp; Bundles
              </h2>
              <div className="flex flex-wrap gap-3">
                {bundles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setPackModal(b)}
                    className="px-5 py-3 rounded-xl border-2 border-accent/50 bg-accent/10 text-foreground font-semibold hover:bg-accent/20 hover:border-accent transition-colors flex items-center gap-2"
                  >
                    <Package size={18} />
                    {b.name}
                    <span className="text-accent">₹{b.price.toLocaleString('en-IN')}</span>
                    {purchasedBundleIds.has(b.id) && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/30 text-xs font-bold">Purchased</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            {(['all', 'technical', 'non-technical'] as const).map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                }`}
              >
                {category === 'all'
                  ? `All Events (${events.length})`
                  : category === 'technical'
                  ? `Technical (${events.filter((e) => e.category === 'technical').length})`
                  : `Non-Technical (${events.filter((e) => e.category === 'non-technical').length})`}
              </motion.button>
            ))}
          </motion.div>

          {/* Events Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/events/${event.id}`)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && router.push(`/events/${event.id}`)}
                className="bg-card rounded-xl overflow-hidden border border-border hover:border-border hover:shadow-xl transition-all duration-300 h-full cursor-pointer group"
              >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-secondary border-b border-border overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl opacity-15 group-hover:scale-110 transition-transform">
                        {event.category === 'technical' ? '⚙️' : '🎮'}
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
                        {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                      {event.name}
                    </h3>

                    <p className="text-foreground/70 text-sm line-clamp-2">{event.longDescription}</p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-foreground/70">
                        <Clock size={16} className="text-accent flex-shrink-0" />
                        <span className="text-xs">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/70">
                        <MapPin size={16} className="text-accent flex-shrink-0" />
                        <span className="text-xs">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/70">
                        <Trophy size={16} className="text-accent flex-shrink-0" />
                        <span className="text-xs">{formatPrizeAmount(event.prizePool)} Prize</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/70">
                        <Users size={16} className="text-accent flex-shrink-0" />
                        <span className="text-xs">
                          {event.registeredCount}/{event.maxParticipants}
                        </span>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="bg-secondary/50 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
                      <div>
                        <p className="text-foreground/60 text-xs">Fee</p>
                        <p className="font-bold text-accent text-lg">₹{event.registrationFee}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {registeredEventIds.has(event.id) ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/20 text-accent rounded-lg font-semibold text-sm cursor-default"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BadgeCheck size={16} />
                            Registered
                          </span>
                        ) : eligibleEventIds.has(event.id) ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleAddFromPack(event.id) }}
                            disabled={!!addingEventId}
                            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold text-sm hover:bg-accent/90 disabled:opacity-50"
                          >
                            {addingEventId === event.id ? 'Adding…' : 'Add to my events'}
                          </button>
                        ) : (
                          <>
                            <Link
                              href={`/checkout/${event.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold text-sm hover:bg-accent/90 inline-flex items-center justify-center"
                            >
                              Register
                            </Link>
                            {bundles.some((b) => !purchasedBundleIds.has(b.id)) && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); const b = bundles.find((x) => !purchasedBundleIds.has(x.id)); if (b) setPackModal(b) }}
                                className="px-4 py-2 border border-accent/50 text-accent rounded-lg font-semibold text-sm hover:bg-accent/10"
                              >
                                Save with pack
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-foreground/60 text-lg">No events found in this category.</p>
            </div>
          )}
        </div>
      </div>

      {packModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setPackModal(null)}
          role="presentation"
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-foreground">{packModal.name}</h3>
              <button type="button" onClick={() => setPackModal(null)} className="p-2 rounded-full hover:bg-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-bold text-accent text-2xl">₹{packModal.price.toLocaleString('en-IN')}</span>
                {packModal.originalPrice != null && (
                  <span className="text-foreground/50 line-through text-sm">₹{packModal.originalPrice.toLocaleString('en-IN')}</span>
                )}
              </div>
              {packModal.description && <p className="text-foreground/70 text-sm mb-4">{packModal.description}</p>}
              <p className="text-foreground/60 text-xs font-semibold uppercase mb-2">Events included</p>
              <ul className="space-y-1.5 text-sm text-foreground/90">
                {packModalEvents.length === 0 ? <li className="text-foreground/50">Loading…</li> : packModalEvents.map((e) => (
                  <li key={e.eventId}>{e.eventName}</li>
                ))}
              </ul>
            </div>
            <div className="p-6 border-t border-border">
              {purchasedBundleIds.has(packModal.id) ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full font-semibold">
                  <BadgeCheck size={18} /> Purchased
                </span>
              ) : (
                <Link
                  href={`/checkout/bundle/${packModal.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-full font-semibold hover:bg-accent/90"
                >
                  <Package size={18} /> Buy pack
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <Footer />
    </main>
  )
}
