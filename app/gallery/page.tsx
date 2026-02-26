'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Images } from 'lucide-react'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { galleryImages } from '@/lib/gallery-data'
import type { GalleryImage } from '@/lib/gallery-data'

export default function GalleryPage() {
  const byEdition = useMemo(() => {
    const v40 = galleryImages.filter((img) => img.vercera === '4.0')
    const v30 = galleryImages.filter((img) => img.vercera === '3.0')
    return { v40, v30 }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-6 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 text-accent">
                <Images className="w-6 h-6" />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                Gallery
              </h1>
            </div>
            <p className="text-foreground/70 text-lg max-w-2xl">
              Photos from Vercera 4.0 and 3.0 — moments, events, and the community.
            </p>
          </motion.div>

          {/* Carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-16"
          >
            <Carousel opts={{ loop: true, align: 'start' }} className="w-full">
              <CarouselContent className="-ml-2 sm:-ml-4">
                {galleryImages.slice(0, 8).map((img) => (
                  <CarouselItem key={img.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <div className="aspect-video rounded-xl overflow-hidden border border-border bg-secondary">
                      <img
                        src={img.src}
                        alt={img.alt ?? `Gallery Vercera ${img.vercera}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 sm:left-4 -translate-y-1/2" />
              <CarouselNext className="right-2 sm:right-4 -translate-y-1/2" />
            </Carousel>
          </motion.div>

          {/* Grid by edition */}
          <EditionGrid title="Vercera 4.0" images={byEdition.v40} delay={0.3} />
          <EditionGrid title="Vercera 3.0" images={byEdition.v30} delay={0.4} />
        </div>
      </div>

      <Footer />
    </main>
  )
}

function EditionGrid({
  title,
  images,
  delay = 0,
}: {
  title: string
  images: GalleryImage[]
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="mb-16"
    >
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-secondary"
          >
            <img
              src={img.src}
              alt={img.alt ?? title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
