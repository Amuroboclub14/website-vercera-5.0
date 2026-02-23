'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Sparkles } from 'lucide-react'

type Variant = 'section' | 'page'

interface EventsComingSoonProps {
  variant?: Variant
  showBackLink?: boolean
}

export function EventsComingSoon({ variant = 'section', showBackLink = false }: EventsComingSoonProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/15 text-accent mb-8"
      >
        <Calendar className="w-10 h-10" strokeWidth={1.5} />
      </motion.div>
      <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" />
        Stay tuned
      </p>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
        Revealing soon
      </h2>
      <p className="text-foreground/70 text-lg sm:text-xl leading-relaxed mb-8">
        We&apos;re curating an incredible lineup of events for Vercera 5.0. 
        Check back soon—something amazing is in the works.
      </p>
      {showBackLink && (
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
        >
          Back to Home
        </Link>
      )}
    </motion.div>
  )

  if (variant === 'page') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
        {content}
      </div>
    )
  }

  return (
    <section id="events" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  )
}
