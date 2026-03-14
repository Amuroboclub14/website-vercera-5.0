'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, MapPin, Trophy, Users, BadgeCheck, Sparkles } from 'lucide-react'
import { formatPrizeAmount } from '@/lib/format-prize'
import type { EventRecord } from '@/lib/events-types'

interface FlagshipEventCardProps {
  event: EventRecord
  isRegistered: boolean
  isEligibleFromPack: boolean
  addingEventId: string | null
  onAddFromPack: (eventId: string) => void
}

export function FlagshipEventCard({
  event,
  isRegistered,
  isEligibleFromPack,
  addingEventId,
  onAddFromPack,
}: FlagshipEventCardProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    router.push(`/events/${event.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && router.push(`/events/${event.id}`)}
      className="group relative w-full overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer
        bg-gradient-to-br from-card via-card to-accent/5
        border-2 border-accent/30 hover:border-accent/60
        shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/15
        transition-all duration-300"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-transparent z-10" />

      <div className="flex flex-col lg:flex-row min-h-[280px] sm:min-h-[320px]">
        {/* Image side - larger, more prominent */}
        <div className="relative lg:w-[45%] xl:w-[40%] h-56 sm:h-64 lg:h-auto min-h-[220px] overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-accent/10 flex items-center justify-center text-6xl opacity-30 group-hover:scale-105 transition-transform">
              {event.category === 'technical' ? '⚙️' : '🎮'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-background/80 via-background/20 to-transparent pointer-events-none" />
          {/* FLAGSHIP badge on image */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider uppercase shadow-lg">
            <Sparkles className="h-3.5 w-3.5" />
            Flagship
          </div>
          <div className="absolute bottom-4 left-4 right-4 lg:hidden">
            <span className="inline-block px-2.5 py-1 rounded-md bg-background/90 text-foreground text-xs font-semibold">
              {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
            </span>
          </div>
        </div>

        {/* Content side */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:pl-8">
          <div>
            <div className="hidden lg:flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-accent/20 text-accent text-xs font-semibold">
                {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
              </span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-accent transition-colors leading-tight mb-2">
              {event.name}
            </h3>
            <p className="text-foreground/75 text-sm sm:text-base line-clamp-2 mb-4">
              {event.longDescription}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70 mb-4">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-accent" />
                {event.date}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-accent" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent" />
                {event.registeredCount ?? 0}/{event.maxParticipants}
              </span>
            </div>

            {/* Prize pool — main highlight */}
            <div className="inline-flex flex-col rounded-xl bg-gradient-to-br from-accent/25 to-accent/10 border border-accent/40 px-5 py-3 mb-2 shadow-lg shadow-accent/10">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Prize Pool</span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-accent">
                {formatPrizeAmount(event.prizePool ?? 0)}
              </span>
            </div>
            <p className="text-foreground/50 text-sm">Fee ₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="hidden sm:block flex-1" />
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {isRegistered ? (
                <span
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent/20 text-accent rounded-xl font-semibold text-sm cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BadgeCheck size={18} />
                  Registered
                </span>
              ) : isEligibleFromPack ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAddFromPack(event.id) }}
                  disabled={!!addingEventId}
                  className="px-5 py-2.5 bg-accent text-accent-foreground rounded-xl font-semibold text-sm hover:bg-accent/90 disabled:opacity-50"
                >
                  {addingEventId === event.id ? 'Adding…' : 'Add to my events'}
                </button>
              ) : (
                <Link
                  href={`/checkout/${event.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-5 py-2.5 bg-accent text-accent-foreground rounded-xl font-semibold text-sm hover:bg-accent/90 inline-flex items-center justify-center"
                >
                  Register for this event
                </Link>
              )}
              <Link
                href={`/events/${event.id}`}
                onClick={(e) => e.stopPropagation()}
                className="px-5 py-2.5 border-2 border-border text-foreground rounded-xl font-semibold text-sm hover:border-accent/50 hover:bg-accent/10 transition-colors"
              >
                View details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
