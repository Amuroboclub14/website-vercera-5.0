'use client'

import Link from 'next/link'
import { useEvents } from '@/hooks/use-events'
import { EventsComingSoon } from '@/components/events-coming-soon'
import { ArrowRight, Users, Trophy } from 'lucide-react'
import type { EventRecord } from '@/lib/events-types'

export function EventsSection() {
  const { events, loading } = useEvents()
  const technical = events.filter((e) => e.category === 'technical')
  const nonTechnical = events.filter((e) => e.category === 'non-technical')

  if (loading) return <section id="events" className="py-20 bg-secondary/30"><div className="max-w-7xl mx-auto px-4 text-center text-foreground/60">Loading events…</div></section>
  if (events.length === 0) return <EventsComingSoon variant="section" />

  return (
    <section id="events" className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Featured Events</h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Choose from a diverse range of technical and non-technical events designed to challenge and inspire.
          </p>
        </div>

        {/* Technical Events */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-accent mb-8">Technical Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technical.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* Non-Technical Events */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-accent mb-8">Non-Technical Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonTechnical.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center pt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-all group"
          >
            Explore Complete Events Catalog
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

interface EventCardProps {
  event: EventRecord
}

function EventCard({ event }: EventCardProps) {
  const count = event.registeredCount ?? 0
  const registrationPercentage = event.maxParticipants > 0 ? (count / event.maxParticipants) * 100 : 0

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-border hover:border-border group cursor-pointer h-full flex flex-col">
        {/* Event Image */}
        <div className="relative w-full h-48 bg-secondary overflow-hidden border-b border-border">
          <div className="flex items-center justify-center h-full">
            <div className="text-5xl opacity-20 group-hover:scale-110 transition-transform">{event.category === 'technical' ? '⚙️' : '🎮'}</div>
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full">
              {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
            </span>
          </div>
        </div>

        {/* Event Content */}
        <div className="p-6 flex-1 flex flex-col gap-4">
          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-accent transition-colors">
            {event.name}
          </h3>

          <p className="text-foreground/70 text-sm line-clamp-2">{event.description}</p>

          {/* Info Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-foreground/80">
              <span>📅 {event.date}</span>
            </div>
            <div className="flex items-center justify-between text-foreground/80">
              <span>📍 {event.venue}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-foreground/60 mb-1">Prize Pool</p>
              <p className="font-bold text-accent">₹{(event.prizePool / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs text-foreground/60 mb-1">Fee</p>
              <p className="font-bold text-accent">₹{event.registrationFee}</p>
            </div>
          </div>

          {/* Registration Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-foreground/60 flex items-center gap-1">
                <Users size={14} /> {count}/{event.maxParticipants}
              </span>
              <span className="text-xs font-medium text-foreground/60">{Math.round(registrationPercentage)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${registrationPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 mt-auto">
            <button className="w-full px-4 py-2 bg-accent/10 text-accent border border-accent rounded-full font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
