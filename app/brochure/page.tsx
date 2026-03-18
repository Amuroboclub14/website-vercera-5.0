import Link from 'next/link'
import { headers } from 'next/headers'
import Image from 'next/image'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { formatPrizeAmount } from '@/lib/format-prize'
import type { EventRecord } from '@/lib/events-types'
import { BrochureActions } from './print-actions'

type EventsResponse = { events?: EventRecord[]; eventsVisible?: boolean; error?: string }

async function getEvents(): Promise<{ events: EventRecord[]; eventsVisible: boolean }> {
  try {
    const h = await headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const base = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(new URL('/api/events', base), { cache: 'no-store' })
    const data = (await res.json()) as EventsResponse
    return {
      events: Array.isArray(data.events) ? data.events : [],
      eventsVisible: data.eventsVisible === true,
    }
  } catch {
    return { events: [], eventsVisible: false }
  }
}

export default async function BrochurePage() {
  const { events, eventsVisible } = await getEvents()

  const flagship = [...events.filter((e) => e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))
  const technical = [...events.filter((e) => e.category === 'technical' && !e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))
  const nonTechnical = [...events.filter((e) => e.category === 'non-technical' && !e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brochure hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <BrochureActions />
              </div>

              <div className="space-y-4">
                <p className="text-foreground/60 text-sm tracking-wide uppercase">Vercera 5.0</p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                  The official brochure
                </h1>
                <p className="text-foreground/75 text-base sm:text-lg leading-relaxed">
                  Vercera is a national-level fest by AMURoboclub at Aligarh Muslim University—built for makers,
                  problem-solvers, creators, gamers, and anyone who loves high-energy competition. This page is designed to
                  be shared as-is (and printable as a PDF). Each event below links to its full page with complete rules and
                  downloadable documents (rulebooks) whenever available.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">What you can expect</h2>
                  <p className="text-foreground/70 leading-relaxed">
                    A mix of technical and non-technical events—designed to be clear, structured, and fun. Prize pools and
                    fees are shown upfront so you can decide quickly. For complete details, open the event page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card/40 px-4 py-4">
                    <p className="text-foreground font-semibold">Clear participation</p>
                    <p className="text-foreground/60 text-sm mt-1">Each event has a dedicated page with rules & docs.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/40 px-4 py-4">
                    <p className="text-foreground font-semibold">Real competition</p>
                    <p className="text-foreground/60 text-sm mt-1">Flagship events on top, sorted by prize pool.</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card/40 px-4 py-4">
                    <p className="text-foreground font-semibold">Fast registration</p>
                    <p className="text-foreground/60 text-sm mt-1">Pay online, then manage your events on the dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-foreground">How to participate</h2>
                <div className="space-y-2 text-foreground/70 leading-relaxed">
                  <p>
                    Open an event and register, or buy a pack/bundle if you want eligibility for multiple events. After
                    payment, add the specific events you want to your profile so registrations are accurate for planning.
                  </p>
                  <p className="text-sm text-foreground/60">
                    Tip: If you’re sharing this brochure on WhatsApp/Instagram, send the link to{' '}
                    <span className="font-semibold text-foreground">/brochure</span> and ask participants to open any event
                    they like.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-border overflow-hidden bg-secondary">
                <Image
                  src="/images/gallery/40-1.webp"
                  alt="Vercera highlights"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border overflow-hidden bg-secondary">
                  <Image
                    src="/images/gallery/30-1.webp"
                    alt="Vercera memories"
                    width={900}
                    height={900}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="rounded-2xl border border-border overflow-hidden bg-secondary">
                  <Image
                    src="/images/gallery/40-3.webp"
                    alt="Vercera crowd"
                    width={900}
                    height={900}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card/40 p-5">
                <h3 className="font-semibold text-foreground">Want the latest info?</h3>
                <p className="text-foreground/65 text-sm mt-1 leading-relaxed">
                  This brochure updates automatically from the live event listings on the website. For the most accurate
                  rules, timings, and documents, always use the event page link.
                </p>
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="mt-10 border border-border rounded-2xl p-8 text-center">
              <p className="text-foreground/80 text-lg font-semibold">No events are available right now.</p>
              <p className="text-foreground/60 text-sm mt-2">
                {eventsVisible === false ? 'Events are currently not published.' : 'Please try again in a moment.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/events" className="inline-flex px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold">
                  Open events page
                </Link>
                <Link href="/" className="inline-flex px-5 py-2.5 bg-secondary border border-border rounded-full font-semibold text-foreground">
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-14 space-y-14">
              {flagship.length > 0 && (
                <section className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Flagship events</h2>
                    <p className="text-foreground/70 leading-relaxed max-w-3xl">
                      These are the headliners of Vercera 5.0—high-impact events with the biggest prize pools. Open an
                      event for complete rules, team requirements, and the rulebook (if available).
                    </p>
                    <p className="text-foreground/50 text-sm">Ordered by prize pool (highest first).</p>
                  </div>

                  <div className="space-y-8">
                    {flagship.map((event) => (
                      <BrochureFeatureRow key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Event catalogue</h2>
                  <p className="text-foreground/70 leading-relaxed max-w-3xl">
                    Browse events below. Each entry gives you the essentials (what it is, prize pool, fee, and schedule),
                    and a direct link to the full event page for rules and documents.
                  </p>
                </div>

                {technical.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">Technical</h3>
                    <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card/20">
                      {technical.map((event) => (
                        <BrochureListRow key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {nonTechnical.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">Non-technical</h3>
                    <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card/20">
                      {nonTechnical.map((event) => (
                        <BrochureListRow key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 text-foreground/60 text-sm">
                  Need packs/bundles? Open{' '}
                  <Link className="text-accent hover:underline" href="/events">
                    /events
                  </Link>{' '}
                  (pinned at the top).
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}

function BrochureFeatureRow({ event }: { event: EventRecord }) {
  return (
    <article className="rounded-3xl border border-border overflow-hidden bg-gradient-to-br from-card/40 via-card/20 to-accent/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 bg-secondary">
          {event.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image} alt={event.name} className="w-full h-full object-cover min-h-[220px] max-h-[360px]" />
          ) : (
            <div className="w-full h-[260px] flex items-center justify-center text-6xl opacity-20">
              {event.category === 'technical' ? '⚙️' : '🎮'}
            </div>
          )}
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Flagship</span>
            <span className="text-foreground/40">•</span>
            <span className="text-xs font-semibold text-foreground/70">
              {event.category === 'technical' ? 'Technical' : 'Non-technical'}
            </span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">{event.name}</h3>
          <p className="text-foreground/75 leading-relaxed">
            {event.longDescription || event.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-foreground/60 text-xs uppercase tracking-wide">Prize pool</p>
              <p className="font-display text-2xl font-bold text-accent">{formatPrizeAmount(event.prizePool ?? 0)}</p>
            </div>
            <div>
              <p className="text-foreground/60 text-xs uppercase tracking-wide">Fee</p>
              <p className="text-foreground font-semibold">₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</p>
            </div>
            <div>
              <p className="text-foreground/60 text-xs uppercase tracking-wide">When & where</p>
              <p className="text-foreground/80 text-sm">{event.date} • {event.time}</p>
              <p className="text-foreground/60 text-sm">{event.venue}</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold hover:bg-accent/90 transition-colors"
            >
              Open full event details & rulebook
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function BrochureListRow({ event }: { event: EventRecord }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
      <div className="lg:col-span-4 bg-secondary border-b lg:border-b-0 lg:border-r border-border">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.name} className="w-full h-56 lg:h-full object-cover" />
        ) : (
          <div className="w-full h-56 lg:h-full flex items-center justify-center text-5xl opacity-20">
            {event.category === 'technical' ? '⚙️' : '🎮'}
          </div>
        )}
      </div>

      <div className="lg:col-span-8 p-6 sm:p-7 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground/70">
            {event.category === 'technical' ? 'Technical' : 'Non-technical'}
          </span>
          <span className="text-foreground/40">•</span>
          <span className="text-xs text-foreground/60">{event.date} • {event.time}</span>
          <span className="text-foreground/40">•</span>
          <span className="text-xs text-foreground/60">{event.venue}</span>
        </div>

        <h4 className="font-display text-2xl font-bold text-foreground leading-tight">{event.name}</h4>
        <p className="text-foreground/75 leading-relaxed">
          {event.description || event.longDescription}
        </p>

        <div className="flex flex-wrap items-end gap-8 pt-1">
          <div>
            <p className="text-foreground/60 text-xs uppercase tracking-wide">Prize pool</p>
            <p className="font-display text-xl font-bold text-accent">{formatPrizeAmount(event.prizePool ?? 0)}</p>
          </div>
          <div>
            <p className="text-foreground/60 text-xs uppercase tracking-wide">Fee</p>
            <p className="text-foreground font-semibold">₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</p>
          </div>
        </div>

        <div className="pt-2">
          <Link href={`/events/${event.id}`} className="text-accent font-semibold hover:underline">
            View complete details & rulebook →
          </Link>
        </div>
      </div>
    </div>
  )
}

