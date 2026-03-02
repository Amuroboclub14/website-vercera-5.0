'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { ArrowLeft, Package, Tag } from 'lucide-react'
import type { PublicBundle } from '@/app/api/bundles/route'

export default function PacksPage() {
  const [bundles, setBundles] = useState<PublicBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/bundles')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBundles(data.bundles ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-foreground/60">Loading packs…</div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-8 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Package className="h-10 w-10 text-accent" />
              Packs & Bundles
            </h1>
            <p className="text-foreground/70 text-lg">
              Save more by registering for multiple events together. Choose a pack that fits you.
            </p>
          </motion.div>

          {error ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">
              {error}
            </div>
          ) : bundles.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-12 text-center">
              <p className="text-foreground/70">No packs or bundles available at the moment. Check back soon.</p>
              <Link href="/events" className="inline-block mt-4 text-accent hover:underline">
                Browse individual events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle, index) => (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-display text-xl font-bold text-foreground">{bundle.name}</h2>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                      {bundle.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {bundle.description && (
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{bundle.description}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    {bundle.originalPrice != null && bundle.originalPrice > bundle.price && (
                      <span className="text-foreground/50 line-through text-sm">
                        ₹{bundle.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="font-display text-2xl font-bold text-accent">
                      ₹{bundle.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    href={`/checkout/bundle/${bundle.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
                  >
                    <Tag size={18} />
                    Register for this pack
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-foreground/60 text-sm text-center">
              You can also register for <Link href="/events" className="text-accent hover:underline">individual events</Link>.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
