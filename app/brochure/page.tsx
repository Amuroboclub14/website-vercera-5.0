import Link from 'next/link'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { formatPrizeAmount } from '@/lib/format-prize'
import type { EventRecord } from '@/lib/events-types'
import { BrochureActions } from './print-actions'

type EventsResponse = { events?: EventRecord[]; error?: string }

async function getEvents(): Promise<EventRecord[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/events`, { cache: 'no-store' })
    const data = (await res.json()) as EventsResponse
    return Array.isArray(data.events) ? data.events : []
  } catch {
    return []
  }
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30 text-xs font-semibold">
      {children}
    </span>
  )
}

export default async function BrochurePage() {
  const events = await getEvents()

  const flagship = [...events.filter((e) => e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))
  const technical = [...events.filter((e) => e.category === 'technical' && !e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))
  const nonTechnical = [...events.filter((e) => e.category === 'non-technical' && !e.flagship)].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge>Official brochure</Badge>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Vercera 5.0 — Events Brochure
              </h1>
              <p className="text-foreground/70 max-w-2xl">
                A quick, shareable overview of all events. Tap any event to open the full page with complete details and rulebooks.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge>Technical + Non-Tech</Badge>
                <Badge>Prize pools</Badge>
                <Badge>Fees</Badge>
                <Badge>Rulebooks on event pages</Badge>
              </div>
            </div>

            <div className="print:hidden">
              <BrochureActions />
            </div>
          </div>

          {events.length === 0 ? (
            <div className="mt-10 bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-foreground/70 text-lg">Brochure will be revealed soon.</p>
              <p className="text-foreground/50 text-sm mt-2">Events aren&apos;t published yet.</p>
              <div className="mt-6">
                <Link href="/" className="inline-flex px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold">
                  Go to home
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 space-y-14">
              {flagship.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                        Flagship events
                      </h2>
                      <p className="text-foreground/60 text-sm">Sorted by prize pool (highest first).</p>
                    </div>
                    <Badge>Don&apos;t miss these</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {flagship.map((event) => (
                      <BrochureFlagshipCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">All events</h2>
                    <p className="text-foreground/60 text-sm">
                      Clear cards with prize pool as the main highlight. Open an event for full rules, team details, and documents.
                    </p>
                  </div>
                </div>

                {technical.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      Technical
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {technical.map((event) => (
                        <BrochureEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {nonTechnical.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      Non-technical
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nonTechnical.map((event) => (
                        <BrochureEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold text-foreground">Want complete details?</h3>
                  <p className="text-foreground/60 text-sm">
                    Every event page has rules, team requirements, and downloadable documents (rulebooks) when available.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/events"
                    className="px-5 py-2.5 bg-accent text-accent-foreground rounded-full font-semibold hover:bg-accent/90 transition-colors"
                  >
                    Open events page
                  </Link>
                  <Link
                    href="/"
                    className="px-5 py-2.5 bg-secondary border border-border rounded-full font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Back to home
                  </Link>
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

function BrochureEventCard({ event }: { event: EventRecord }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 transition-all flex flex-col"
    >
      <div className="relative w-full h-44 bg-secondary overflow-hidden border-b border-border">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">{event.category === 'technical' ? '⚙️' : '🎮'}</div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-background/85 text-foreground text-xs font-bold rounded-full border border-border">
            {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
            {event.name}
          </h3>
          <p className="text-foreground/70 text-sm line-clamp-2">{event.description || event.longDescription}</p>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
          <p className="text-xs text-accent font-semibold uppercase tracking-wide">Prize Pool</p>
          <p className="font-display text-2xl font-bold text-accent">{formatPrizeAmount(event.prizePool ?? 0)}</p>
          <p className="text-foreground/50 text-xs mt-1">Fee ₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</p>
        </div>

        <div className="text-xs text-foreground/60 grid grid-cols-2 gap-2">
          <span className="truncate">📅 {event.date}</span>
          <span className="truncate">⏰ {event.time}</span>
          <span className="col-span-2 truncate">📍 {event.venue}</span>
        </div>

        <div className="mt-auto pt-2">
          <div className="w-full text-center px-4 py-2 rounded-full border border-border bg-secondary/40 text-foreground text-sm font-semibold group-hover:border-accent/40 group-hover:bg-accent/10 transition-colors">
            View full details & rulebook
          </div>
        </div>
      </div>
    </Link>
  )
}

function BrochureFlagshipCard({ event }: { event: EventRecord }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-accent/30 hover:border-accent/60 bg-gradient-to-br from-card via-card to-accent/5 shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/15 transition-all"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-transparent" />

      <div className="flex flex-col lg:flex-row min-h-[260px] sm:min-h-[300px]">
        <div className="relative lg:w-[45%] xl:w-[40%] h-56 sm:h-64 lg:h-auto min-h-[220px] overflow-hidden bg-secondary">
          {event.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">{event.category === 'technical' ? '⚙️' : '🎮'}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-background/80 via-background/20 to-transparent pointer-events-none" />
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold tracking-wider uppercase shadow-lg">
            Flagship
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:pl-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md bg-accent/20 text-accent text-xs font-semibold">
                {event.category === 'technical' ? 'Technical' : 'Non-Tech'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-secondary/70 text-foreground/80 text-xs font-semibold border border-border">
                Tap for full rules & rulebook
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
              {event.name}
            </h3>
            <p className="text-foreground/75 text-sm sm:text-base line-clamp-2">{event.longDescription}</p>

            <div className="inline-flex flex-col rounded-xl bg-gradient-to-br from-accent/25 to-accent/10 border border-accent/40 px-5 py-3 shadow-lg shadow-accent/10 w-fit">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Prize Pool</span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-accent">{formatPrizeAmount(event.prizePool ?? 0)}</span>
              <span className="text-foreground/50 text-sm mt-1">Fee ₹{event.registrationFee?.toLocaleString('en-IN') ?? 0}</span>
            </div>
          </div>

          <div className="mt-6 text-sm text-foreground/70 flex flex-wrap gap-x-6 gap-y-2">
            <span>📅 {event.date}</span>
            <span>⏰ {event.time}</span>
            <span>📍 {event.venue}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

