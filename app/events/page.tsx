'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { events } from '@/lib/events'
import { ArrowLeft, Users, Trophy, Clock, MapPin } from 'lucide-react'

export default function EventsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'technical' | 'non-technical'>('all')

  const filteredEvents =
    selectedCategory === 'all' ? events : events.filter((e) => e.category === selectedCategory)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-6 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-foreground mb-4">
              All Events
            </h1>
            <p className="text-foreground/70 text-lg">Explore our complete catalog of technical and non-technical events at Vercera 5.0</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-accent to-primary text-accent-foreground shadow-lg shadow-accent/30'
                  : 'bg-secondary/70 text-foreground hover:bg-secondary/90 border border-border/50'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setSelectedCategory('technical')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === 'technical'
                  ? 'bg-gradient-to-r from-accent to-primary text-accent-foreground shadow-lg shadow-accent/30'
                  : 'bg-secondary/70 text-foreground hover:bg-secondary/90 border border-border/50'
              }`}
            >
              Technical ({events.filter((e) => e.category === 'technical').length})
            </button>
            <button
              onClick={() => setSelectedCategory('non-technical')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === 'non-technical'
                  ? 'bg-gradient-to-r from-accent to-primary text-accent-foreground shadow-lg shadow-accent/30'
                  : 'bg-secondary/70 text-foreground hover:bg-secondary/90 border border-border/50'
              }`}
            >
              Non-Technical ({events.filter((e) => e.category === 'non-technical').length})
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/events/${event.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/events/${event.id}`)}
                className="bg-card rounded-xl overflow-hidden border border-border/50 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 h-full cursor-pointer group"
              >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-accent/8 to-primary/8">
                    <div className="flex items-center justify-center h-full text-5xl opacity-25 group-hover:scale-110 transition-transform">
                      {event.category === 'technical' ? '⚙️' : '🎮'}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-accent to-primary text-accent-foreground text-xs font-bold rounded-full">
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
                      <Link
                        href={`/checkout/${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-5 py-2 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all text-sm"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                </div>
            ))}
          </div>

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
