'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Images } from 'lucide-react'
import { featuredGalleryImages } from '@/lib/gallery-data'

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 text-accent mb-4">
            <Images className="w-6 h-6" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Memories from past editions
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            A glimpse of Vercera 4.0 and 3.0 — the energy, the events, and the community.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, staggerChildren: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-12"
        >
          {featuredGalleryImages.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-secondary group"
            >
              <img
                src={img.src}
                alt={img.alt ?? `Gallery ${img.vercera}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Vercera {img.vercera}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors"
          >
            View full gallery
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
