'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, ArrowRight } from 'lucide-react'

type Bundle = { id: string; name: string; type: string; price: number; originalPrice?: number; description?: string }

export function PacksSection() {
  const [bundles, setBundles] = useState<Bundle[]>([])

  useEffect(() => {
    fetch('/api/bundles')
      .then((r) => r.json())
      .then((d) => { if (d.bundles) setBundles(d.bundles) })
      .catch(() => setBundles([]))
  }, [])

  if (bundles.length === 0) return null

  return (
    <section id="packs" className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Packs &amp; <span className="text-accent">Bundles</span>
          </h2>
          <p className="text-white/85 text-lg max-w-2xl mx-auto">
            Save more when you buy a pack. Get access to multiple events at a better price.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
        >
          {bundles.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card/90 backdrop-blur border border-border rounded-2xl p-6 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">{b.name}</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-bold text-accent text-2xl">₹{b.price.toLocaleString('en-IN')}</span>
                {b.originalPrice != null && (
                  <span className="text-foreground/50 line-through text-sm">₹{b.originalPrice.toLocaleString('en-IN')}</span>
                )}
              </div>
              {b.description && <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{b.description}</p>}
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold text-sm hover:bg-accent/90 transition-colors"
              >
                View pack & events <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
