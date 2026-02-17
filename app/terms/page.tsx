import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-8">Terms of Service</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
              <p className="text-foreground/70 leading-relaxed">
                By accessing and using Vercera 5.0's website and services, you accept and agree to be bound by and comply
                with these terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">2. Event Registration</h2>
              <p className="text-foreground/70 leading-relaxed">
                Event registrations are non-refundable. You may request a transfer of your registration to another
                participant within 7 days of the event. Any cancellation requests made 7 days or less before the event will
                not be refunded.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">3. Payment Terms</h2>
              <p className="text-foreground/70 leading-relaxed">
                All payments are processed through Razorpay. Payment is non-refundable once processed. We are not
                responsible for any third-party payment processor issues.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">4. User Conduct</h2>
              <p className="text-foreground/70 leading-relaxed">
                Users must conduct themselves ethically and professionally during all events. Violations of event rules or
                engaging in inappropriate behavior may result in disqualification without refunds.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">5. Intellectual Property</h2>
              <p className="text-foreground/70 leading-relaxed">
                All content and materials provided are the intellectual property of Vercera 5.0 unless otherwise stated.
                Participants retain ownership of their submitted work.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">6. Limitations of Liability</h2>
              <p className="text-foreground/70 leading-relaxed">
                Vercera 5.0 is provided "as is" without warranties. We are not liable for any direct or indirect damages
                arising from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">7. Changes to Terms</h2>
              <p className="text-foreground/70 leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the platform after changes
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">8. Contact</h2>
              <p className="text-foreground/70 leading-relaxed">
                For questions about these terms, please contact us at info@vercera.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
