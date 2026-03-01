'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Gem, Medal, Calendar, Gift } from 'lucide-react'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'

const SPONSOR_TIERS = [
  {
    id: 'title',
    title: 'Title Sponsor',
    description: 'Our premier partner for Vercera 5.0.',
    icon: Award,
    placeholder: 'Title sponsor slot',
  },
  {
    id: 'gold',
    title: 'Gold Sponsor',
    description: 'Gold-tier partners supporting the fest.',
    icon: Gem,
    placeholder: 'Gold sponsor slots',
  },
  {
    id: 'silver',
    title: 'Silver Sponsor',
    description: 'Silver-tier partners and collaborators.',
    icon: Medal,
    placeholder: 'Silver sponsor slots',
  },
  {
    id: 'event',
    title: 'Event Sponsor',
    description: 'Partners supporting individual events.',
    icon: Calendar,
    placeholder: 'Event sponsor slots',
  },
  {
    id: 'in-kind',
    title: 'In-Kind Sponsor',
    description: 'Partners contributing in kind.',
    icon: Gift,
    placeholder: 'In-kind sponsor slots',
  },
] as const

function SponsorTierCard({
  title,
  description,
  icon: Icon,
  placeholder,
  index,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  index: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-foreground/70 text-sm sm:text-base mt-1">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-[2/1] rounded-xl border border-dashed border-border/60 bg-background/50 flex items-center justify-center text-foreground/40 text-sm"
          >
            {placeholder}
          </div>
        ))}
      </div>
    </motion.section>
  )
}

export default function SponsorsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-6 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-2">
              Our <span className="text-accent">Sponsors</span>
            </h1>
            <p className="text-foreground/70 text-lg max-w-2xl">
              Partners and sponsors who make Vercera 5.0 possible. Interested in sponsoring? Get in touch.
            </p>
          </motion.div>

          <div className="space-y-10">
            {SPONSOR_TIERS.map((tier, index) => (
              <SponsorTierCard key={tier.id} {...tier} index={index} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
