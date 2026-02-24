import { Navbar } from '@/components/animated-navbar'
import { Hero } from '@/components/hero'
import { EventsSection } from '@/components/animated-events-section'
import { GallerySection } from '@/components/gallery-section'
import { FAQSection } from '@/components/animated-faq-section'
import { Footer } from '@/components/footer'
import { AnimatedHeroBackground } from '@/components/animated-hero-background'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* Single continuous background for hero + events + FAQ — no seams */}
      <div>
        <AnimatedHeroBackground />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-background/0 to-background/60 pointer-events-none" aria-hidden />
        <Hero />
        <EventsSection />
        <GallerySection />
        <FAQSection />
      </div>
      <Footer />
    </main>
  )
}
