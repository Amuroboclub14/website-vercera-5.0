'use client'

import { useState, useEffect, useMemo } from 'react'

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
import { ArrowLeft, Users, Trophy, Clock, MapPin, BadgeCheck, Package, X, Check, Info } from 'lucide-react'
import { formatPrizeAmount } from '@/lib/format-prize'
import { PackTierCard } from '@/components/pack-tier-card'
import { FlagshipEventCard } from '@/components/flagship-event-card'

type Bundle = { id: string; name: string; type: string; price: number; originalPrice?: number; description?: string; perks?: string[]; highlight?: boolean }
type PackEvent = { eventId: string; eventName: string }

export default function EventsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { events, loading, error, showComingSoon } = useEvents()
  const { registeredEventIds, purchasedBundleIds } = useMyRegistrations()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'flagship' | 'technical' | 'non-technical'>('all')
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

  const filteredEvents = useMemo(() => {
    const list =
      selectedCategory === 'flagship'
        ? events.filter((e) => e.flagship)
        : selectedCategory === 'all'
          ? events
          : events.filter((e) => e.category === selectedCategory)
    return [...list.filter((e) => e.flagship), ...list.filter((e) => !e.flagship)]
  }, [events, selectedCategory])

  const flagshipEvents = useMemo(
    () => [...filteredEvents.filter((e) => e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0)),
    [filteredEvents]
  )
  const otherEvents = filteredEvents.filter((e) => !e.flagship)

  const packsOrdered = useMemo(() => {
    const highlighted = bundles.find((b) => b.highlight)
    const rest = bundles.filter((b) => !b.highlight)
    return [...(highlighted ? [highlighted] : []), ...rest]
  }, [bundles])

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

          {/* Packs - responsive grid, highlighted first */}
          {bundles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-12"
            >
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  <Package className="h-7 w-7 text-accent" />
                  Packs &amp; Bundles
                </h2>
                <p className="text-foreground/60 text-sm mt-1">Buy a pack to get multiple events at a discount. After payment, add the events you want to your profile.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                {packsOrdered.map((b) => (
                  <div key={b.id} className="flex min-w-0">
                    <PackTierCard
                      bundle={b}
                      purchased={purchasedBundleIds.has(b.id)}
                      onSelect={() => setPackModal(b)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* How it works — clear guidance */}
          <div className="mb-8 rounded-xl border border-border bg-card/80 px-4 py-4 sm:px-6 sm:py-5">
            <h3 className="font-semibold text-foreground text-sm sm:text-base mb-2">How to register</h3>
            <ul className="text-sm text-foreground/85 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">1.</span>
                <span><strong className="text-foreground">Buy a pack</strong> (above) — Get multiple events at a discount. After payment, add the events you want to your profile from this page or your dashboard.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">2.</span>
                <span><strong className="text-foreground">Or register for one event</strong> — Click &quot;Register for this event&quot; on any event below to pay and register for that event only.</span>
              </li>
            </ul>
          </div>

          {/* Pack purchase instructions — show when user has purchased a bundle */}
          {user && purchasedBundleIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-start gap-2 flex-1">
                <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/90">
                  You have a pack. <strong className="text-foreground">Add events to your profile</strong> by clicking <strong className="text-accent">&quot;Add to my events&quot;</strong> on any event that&apos;s included — below or on your dashboard.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-accent hover:text-accent/80 whitespace-nowrap"
              >
                Dashboard →
              </Link>
            </motion.div>
          )}

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap gap-3 mb-12"
          >
            {(['all', 'flagship', 'technical', 'non-technical'] as const).map((category, index) => (
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
                  : category === 'flagship'
                  ? `Flagship (${events.filter((e) => e.flagship).length})`
                  : category === 'technical'
                  ? `Technical (${events.filter((e) => e.category === 'technical').length})`
                  : `Non-Technical (${events.filter((e) => e.category === 'non-technical').length})`}
              </motion.button>
            ))}
          </motion.div>

          {/* Flagship events - distinct full-width cards */}
          {flagshipEvents.length > 0 && (
            <div className="space-y-6 mb-10">
              {flagshipEvents.map((event) => (
                <FlagshipEventCard
                  key={event.id}
                  event={event}
                  isRegistered={registeredEventIds.has(event.id)}
                  isEligibleFromPack={eligibleEventIds.has(event.id)}
                  addingEventId={addingEventId}
                  onAddFromPack={handleAddFromPack}
                />
              ))}
            </div>
          )}

          {/* Other events grid */}
          {otherEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {otherEvents.map((event, index) => (
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
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-foreground/70 text-sm line-clamp-2">{event.longDescription}</p>
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
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-4">
                      <div className="flex items-baseline gap-4">
                        <div>
                          <p className="text-foreground/60 text-xs">Prize Pool</p>
                          <p className="font-bold text-accent text-xl">{formatPrizeAmount(event.prizePool ?? 0)}</p>
                        </div>
                        <div>
                          <p className="text-foreground/50 text-xs">Fee</p>
                          <p className="font-medium text-foreground/70 text-sm">₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</p>
                        </div>
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
                          <Link
                            href={`/checkout/${event.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold text-sm hover:bg-accent/90 inline-flex items-center justify-center"
                          >
                            Register for this event
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

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
              {(packModal.perks?.length ?? 0) > 0 && (
                <>
                  <p className="text-foreground/60 text-xs font-semibold uppercase mb-2">What&apos;s included</p>
                  <ul className="space-y-1.5 text-sm text-foreground/90 mb-4">
                    {packModal.perks!.map((perk, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-accent flex-shrink-0" strokeWidth={2.5} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </>
              )}
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
