'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { useEvents } from '@/hooks/use-events'
import { EventsComingSoon } from '@/components/events-coming-soon'
import { ArrowLeft, Users, Trophy, Clock, MapPin } from 'lucide-react'

export default function EventsPage() {
  const router = useRouter()
  const { events, loading, error } = useEvents()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'non-technical'>('all')

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

  if (!error && events.length === 0) {
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
                  <div className="relative w-full h-48 bg-secondary border-b border-border">
                    <div className="flex items-center justify-center h-full text-5xl opacity-15 group-hover:scale-110 transition-transform">
                      {event.category === 'technical' ? '⚙️' : '🎮'}
                    </div>
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
                        <span className="text-xs">₹{(event.prizePool / 100000).toFixed(1)}L Prize</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground/70">
                        <Users size={16} className="text-accent flex-shrink-0" />
                        <span className="text-xs">
                          {event.registeredCount}/{event.maxParticipants}
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-secondary/50 rounded-lg p-4 flex justify-between items-center mt-4">
                      <div>
                        <p className="text-foreground/60 text-xs">Fee</p>
                        <p className="font-bold text-accent text-lg">₹{event.registrationFee}</p>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          href={`/checkout/${event.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-5 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-all text-sm"
                        >
                          Register
                        </Link>
                      </motion.div>
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

      <Footer />
    </main>
  )
}
