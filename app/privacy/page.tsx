import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-foreground/70 leading-relaxed">
                We collect information you provide directly such as name, email, phone number, college affiliation, and
                payment information. We also collect information about your interactions with our platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-foreground/70 leading-relaxed">
                We use your information to process registrations, manage events, process payments, send updates, and improve
                our services. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">3. Data Security</h2>
              <p className="text-foreground/70 leading-relaxed">
                We implement industry-standard security measures to protect your data. Payment information is processed
                securely through Razorpay with SSL encryption.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">4. Cookies and Tracking</h2>
              <p className="text-foreground/70 leading-relaxed">
                We may use cookies to enhance your experience. You can disable cookies in your browser settings, though
                this may affect functionality.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">5. Third-Party Services</h2>
              <p className="text-foreground/70 leading-relaxed">
                We use third-party services like Razorpay for payments. Their privacy practices are governed by their own
                policies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
              <p className="text-foreground/70 leading-relaxed">
                You have the right to access, correct, or delete your personal information. Contact us at info@vercera.com
                to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">7. Children's Privacy</h2>
              <p className="text-foreground/70 leading-relaxed">
                Our services are not intended for children under 13. We do not knowingly collect information from children
                under 13.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">8. Policy Changes</h2>
              <p className="text-foreground/70 leading-relaxed">
                We may update this policy periodically. Continued use indicates acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">9. Contact Us</h2>
              <p className="text-foreground/70 leading-relaxed">
                For privacy inquiries, contact us at info@vercera.com or visit our contact page.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
