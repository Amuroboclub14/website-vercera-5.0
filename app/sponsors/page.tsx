'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, ExternalLink, Gift } from 'lucide-react'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'

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
              Our current featured partner for Vercera 5.0.
            </p>
          </motion.div>

          <motion.a
            href="https://stickapp.club"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="group block rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8 hover:border-accent/60 hover:bg-card/60 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    Event Sponsor
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                    <Gift className="h-3.5 w-3.5" />
                    In-Kind Sponsor
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Stick<sup className="text-sm align-super">®</sup>
                </h2>
                <p className="text-foreground/70 mt-2 max-w-2xl">
                  Stick is supporting Vercera 5.0 as both our Event Sponsor and In-Kind Sponsor.
                </p>
                <p className="inline-flex items-center gap-1.5 mt-4 text-accent text-sm font-medium">
                  Visit stickapp.club
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>

              <div className="shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border border-border/60 bg-background/70 p-4 flex items-center justify-center">
                  <img
                    src="/stick_logomark_coloured.svg"
                    alt="Stick logo"
                    className="block w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </motion.a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
