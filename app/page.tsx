import { Navbar } from '@/components/animated-navbar'
import { ThreeHero } from '@/components/three-hero'
import { EventsSection } from '@/components/animated-events-section'
import { FAQSection } from '@/components/animated-faq-section'
import { Footer } from '@/components/footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <ThreeHero />
      <EventsSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
