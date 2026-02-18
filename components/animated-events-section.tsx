'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { events } from '@/lib/events'
import { ArrowRight, Users, Trophy } from 'lucide-react'
import { GridScanJSCSS } from '@/components/GridScan-JS-CSS'
import { useBackgroundQuality } from '@/hooks/use-prefer-light-backgrounds'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function EventsSection() {
  const technical = events.filter((e) => e.category === 'technical')
  const nonTechnical = events.filter((e) => e.category === 'non-technical')
  const { preferLightBackgrounds: preferLight, enablePostProcessing } = useBackgroundQuality()

  return (
    <section id="events" className="py-20 bg-secondary/30 relative overflow-hidden">
      {/* Background: GridScan on desktop, lightweight gradient on mobile/slow devices */}
      <div className="absolute inset-0 w-full h-full min-h-[600px]">
        {preferLight ? (
          <div
            className="absolute inset-0 w-full h-full min-h-[600px] bg-gradient-to-b from-accent/5 via-secondary/30 to-accent/5"
            style={{
              backgroundImage: 'linear-gradient(rgba(42, 61, 42, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 61, 42, 0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />
        ) : (
          <div className="absolute inset-0 w-full h-full min-h-[600px]" style={{ position: 'relative' }}>
            <GridScanJSCSS
              sensitivity={0.55}
              lineThickness={1}
              linesColor="#2a3d2a"
              gridScale={0.1}
              scanColor="#C1E734"
              scanOpacity={0.4}
              enablePost={enablePostProcessing}
              bloomIntensity={0.5}
              chromaticAberration={0.002}
              noiseIntensity={0.01}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-secondary/40 pointer-events-none" aria-hidden />
      </div>

      {/* Content — pointer-events-none so GridScan gets mouse; interactive elements get pointer-events-auto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pointer-events-none">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Featured Events</h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Choose from a diverse range of technical and non-technical events designed to challenge and inspire.
          </p>
        </motion.div>

        {/* Technical Events */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-accent mb-8"
          >
            Technical Events
          </motion.h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:pointer-events-auto"
          >
            {technical.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        </div>

        {/* Non-Technical Events */}
        <div className="mb-8">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-accent mb-8"
          >
            Non-Technical Events
          </motion.h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:pointer-events-auto"
          >
            {nonTechnical.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center pt-8 pointer-events-auto"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all group shadow-lg shadow-accent/20"
            >
              Explore Complete Events Catalog
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

interface EventCardProps {
  event: (typeof events)[0]
}

function EventCard({ event }: EventCardProps) {
  const registrationPercentage = (event.registeredCount / event.maxParticipants) * 100

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
      <Link href={`/events/${event.id}`}>
        <div className="bg-card rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-border group cursor-pointer h-full flex flex-col">
          {/* Event Image */}
          <div className="relative w-full h-48 bg-secondary overflow-hidden border-b border-border">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                {event.category === 'technical' ? '⚙️' : '🎮'}
              </div>
            </motion.div>
            <div className="absolute top-3 right-3">
              <motion.span
                whileHover={{ scale: 1.1 }}
                className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full"
              >
                {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
              </motion.span>
            </div>
          </div>

          {/* Event Content */}
          <div className="p-6 flex-1 flex flex-col gap-4">
            <motion.h3
              whileHover={{ color: '#C1E734' }}
              className="font-display text-xl font-bold text-foreground transition-colors"
            >
              {event.name}
            </motion.h3>

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
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-secondary rounded-lg p-3"
              >
                <p className="text-xs text-foreground/60 mb-1">Prize Pool</p>
                <p className="font-bold text-accent">₹{(event.prizePool / 100000).toFixed(1)}L</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-secondary rounded-lg p-3"
              >
                <p className="text-xs text-foreground/60 mb-1">Fee</p>
                <p className="font-bold text-accent">₹{event.registrationFee}</p>
              </motion.div>
            </div>

            {/* Registration Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground/60 flex items-center gap-1">
                  <Users size={14} /> {event.registeredCount}/{event.maxParticipants}
                </span>
                <span className="text-xs font-medium text-foreground/60">{Math.round(registrationPercentage)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${registrationPercentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-accent h-2 rounded-full"
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 mt-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 bg-accent/10 text-accent border border-accent rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
              >
                View Details
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
