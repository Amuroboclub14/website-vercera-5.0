import { Navbar } from '@/components/animated-navbar'
import { Hero } from '@/components/hero'
import { PacksSection } from '@/components/packs-section'
import { EventsSection } from '@/components/animated-events-section'
import { GallerySection } from '@/components/gallery-section'
import { FAQSection } from '@/components/animated-faq-section'
import { Footer } from '@/components/footer'
import { AnimatedHeroBackground } from '@/components/animated-hero-background'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="relative">
        <AnimatedHeroBackground />
        <Hero />
        <PacksSection />
        <EventsSection />
        <GallerySection />
        <FAQSection />
      </div>
      <Footer />
    </main>
  )
}
