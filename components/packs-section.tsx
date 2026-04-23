'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useMyRegistrations } from '@/hooks/use-my-registrations'
import { PackTierCard, type PackTierBundle } from '@/components/pack-tier-card'
import { FEST_STATUS } from '@/lib/fest-status'

export function PacksSection() {
  const [bundles, setBundles] = useState<PackTierBundle[]>([])
  const { purchasedBundleIds } = useMyRegistrations()

  useEffect(() => {
    fetch('/api/bundles')
      .then((r) => r.json())
      .then((d) => {
        if (d.bundles && Array.isArray(d.bundles)) {
          setBundles(d.bundles.map((b: PackTierBundle) => ({
            id: b.id,
            name: b.name,
            price: b.price,
            originalPrice: b.originalPrice,
            description: b.description,
            perks: b.perks,
            highlight: b.highlight,
          })))
        }
      })
      .catch(() => setBundles([]))
  }, [])

  if (bundles.length === 0) return null

  const highlighted = bundles.find((b) => b.highlight)
  const rest = bundles.filter((b) => !b.highlight)
  const ordered = [...(highlighted ? [highlighted] : []), ...rest]

  return (
    <section id="packs" className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-14"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Packs &amp; <span className="text-accent">Bundles</span>
          </h2>
          <p className="text-white/85 text-lg max-w-2xl mx-auto">
            {FEST_STATUS.isOver
              ? 'Vercera 5.0 packs are now shown as archive highlights from a successful fest.'
              : 'Buy a pack for multiple events at a discount. After payment, add the events you want to your profile from the Events page or your dashboard.'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch"
        >
          {ordered.map((b) => (
            <div key={b.id} className="flex min-w-0">
              <PackTierCard
                bundle={b}
                purchased={purchasedBundleIds.has(b.id)}
                href="/events"
              />
            </div>
          ))}
        </motion.div>
        <p className="text-center text-foreground/50 text-sm mt-8 sm:mt-10 max-w-xl mx-auto">
          {FEST_STATUS.isOver
            ? FEST_STATUS.paymentsClosedMessage
            : "Pay once. Add events from your dashboard anytime. We don't store or sell your data."}
        </p>
      </div>
    </section>
  )
}
