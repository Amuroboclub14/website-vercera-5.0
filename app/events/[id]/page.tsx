'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { events } from '@/lib/events'
import { ArrowLeft, Clock, MapPin, Users, Trophy, Check, BadgeCheck, QrCode } from 'lucide-react'
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  params: Promise<{ id: string }>
}

type RegistrationDoc = {
  id: string
  status?: string
  registrationDate?: string
  amount?: number
  isTeamEvent?: boolean
  isTeamLeader?: boolean
  teamId?: string
  verceraTeamId?: string
}

type TeamMember = {
  userId: string
  verceraId: string
  fullName: string
  email: string
  isLeader?: boolean
}

type TeamDoc = {
  teamName?: string | null
  verceraTeamId: string
  members: TeamMember[]
  size?: number
}

export default function EventDetailPage({ params }: Props) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { id } = use(params)
  const event = events.find((e) => e.id === id)
  const [isRegistering, setIsRegistering] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [registration, setRegistration] = useState<RegistrationDoc | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [team, setTeam] = useState<TeamDoc | null>(null)

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">Event Not Found</h1>
            <p className="text-foreground/70 mb-8">The event you're looking for doesn't exist.</p>
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all"
            >
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const registrationPercentage = (event.registeredCount / event.maxParticipants) * 100
  const spotsAvailable = event.maxParticipants - event.registeredCount
  const isTeamEvent = event.isTeamEvent ?? false
  const teamSizeText = useMemo(() => {
    if (!isTeamEvent) return 'Solo'
    const min = event.teamSizeMin ?? 1
    const max = event.teamSizeMax ?? min
    return min === max ? `${min}` : `${min}-${max}`
  }, [event.teamSizeMin, event.teamSizeMax, isTeamEvent])

  useEffect(() => {
    if (!user || !event) {
      setRegistration(null)
      setTeam(null)
      return
    }

    const run = async () => {
      setRegLoading(true)
      setTeamLoading(false)
      setTeam(null)

      try {
        const regsRef = collection(db, 'registrations')
        const q = query(regsRef, where('userId', '==', user.uid), where('eventId', '==', event.id), limit(1))
        const snap = await getDocs(q)
        if (snap.empty) {
          setRegistration(null)
          return
        }

        const d = snap.docs[0].data() as Record<string, unknown>
        const reg: RegistrationDoc = {
          id: snap.docs[0].id,
          status: (d.status as string | undefined) ?? undefined,
          registrationDate: (d.registrationDate as string | undefined) ?? undefined,
          amount: (d.amount as number | undefined) ?? undefined,
          isTeamEvent: Boolean(d.isTeamEvent),
          isTeamLeader: Boolean(d.isTeamLeader),
          teamId: (d.teamId as string | undefined) ?? undefined,
          verceraTeamId: (d.verceraTeamId as string | undefined) ?? undefined,
        }
        setRegistration(reg)

        if (reg.teamId) {
          setTeamLoading(true)
          const teamSnap = await getDoc(doc(db, 'teams', reg.teamId))
          if (teamSnap.exists()) {
            const td = teamSnap.data() as Record<string, unknown>
            setTeam({
              teamName: (td.teamName as string | null | undefined) ?? null,
              verceraTeamId: String(td.verceraTeamId || ''),
              members: (td.members as TeamMember[]) || [],
              size: (td.size as number | undefined) ?? undefined,
            })
          } else {
            setTeam(null)
          }
        }
      } catch {
        setRegistration(null)
        setTeam(null)
      } finally {
        setRegLoading(false)
        setTeamLoading(false)
      }
    }

    run()
  }, [user, event])

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/events/${event.id}`)
    } else {
      router.push(`/checkout/${event.id}`)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/90 transition-colors mb-8 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Events
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                      {event.name}
                    </h1>
                    <p className="text-foreground/70 text-lg mt-2">{event.description}</p>
                  </div>
                  <span className="px-4 py-2 bg-accent/10 text-accent rounded-full font-semibold text-sm flex-shrink-0 border border-accent/30">
                    {event.category === 'technical' ? 'Technical' : 'Non-Technical'}
                  </span>
                </div>
              </div>

              {/* Event Image */}
              <div className="w-full h-96 bg-secondary rounded-xl flex items-center justify-center text-7xl border border-border">
                {event.category === 'technical' ? '⚙️' : '🎮'}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Date & Time</span>
                  </div>
                  <p className="font-semibold text-foreground">{event.date}</p>
                  <p className="text-foreground/60 text-sm">{event.time}</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Venue</span>
                  </div>
                  <p className="font-semibold text-foreground">{event.venue}</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Prize Pool</span>
                  </div>
                  <p className="font-semibold text-foreground">₹{(event.prizePool / 100000).toFixed(1)}L</p>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-card hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={20} className="text-accent" />
                    <span className="text-foreground/60 text-sm">Registrations</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {event.registeredCount}/{event.maxParticipants}
                  </p>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">About this Event</h2>
                <p className="text-foreground/70 leading-relaxed">{event.longDescription}</p>
              </div>

              {/* Rules Section */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">Rules & Guidelines</h2>
                <ul className="space-y-3">
                  {event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check size={20} className="text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/70">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prize Breakdown */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">Prize Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {event.prizes.map((prize, index) => (
                    <div key={index} className="bg-secondary border border-border rounded-lg p-6">
                      <p className="text-foreground/60 text-sm mb-2">{prize.position}</p>
                      <p className="font-display text-3xl font-bold text-accent">₹{(prize.amount / 100000).toFixed(1)}L</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Registration Card */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
                {/* Registered Status */}
                {regLoading ? (
                  <div className="bg-secondary rounded-lg p-4 text-sm text-foreground/70">
                    Checking your registration…
                  </div>
                ) : registration ? (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-accent font-semibold">
                      <BadgeCheck size={18} />
                      Registered
                    </div>
                    <p className="text-foreground/70 text-sm">
                      {registration.isTeamEvent ? 'Team registration confirmed.' : 'Your registration is confirmed.'}
                    </p>
                    {registration.registrationDate && (
                      <p className="text-xs text-foreground/60">Date: {registration.registrationDate}</p>
                    )}
                  </div>
                ) : null}

                {/* Price Section */}
                <div className="space-y-2">
                  <p className="text-foreground/60 text-sm">Registration Fee</p>
                  <p className="font-display text-4xl font-bold text-accent">₹{event.registrationFee}</p>
                  {isTeamEvent && (
                    <p className="text-xs text-foreground/60">
                      Per-person fee • Team size: {teamSizeText}
                    </p>
                  )}
                </div>

                {/* Registration Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60 text-sm">Spots Available</span>
                    <span className="font-semibold text-foreground">{spotsAvailable} left</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div
                      className="bg-accent h-3 rounded-full transition-all"
                      style={{ width: `${registrationPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-foreground/60 text-xs">
                    {event.registeredCount}/{event.maxParticipants} registered
                  </p>
                </div>

                {/* CTA Button */}
                {registration ? (
                  <button
                    disabled
                    className="w-full px-6 py-3 bg-accent/20 text-accent rounded-lg font-bold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <BadgeCheck size={18} />
                    Registered
                  </button>
                ) : spotsAvailable > 0 ? (
                  <button
                    onClick={handleRegisterClick}
                    disabled={isRegistering}
                    className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Processing...' : 'Register Now'}
                  </button>
                ) : (
                  <button disabled className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-bold cursor-not-allowed">
                    Registration Closed
                  </button>
                )}

                {/* Team Info (if registered as team) */}
                {registration?.isTeamEvent && (
                  <div className="bg-secondary/50 border border-border/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <QrCode size={18} className="text-accent" />
                      Team Details
                    </div>

                    {teamLoading ? (
                      <p className="text-sm text-foreground/60">Loading team info…</p>
                    ) : team && team.verceraTeamId ? (
                      <>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground/60">Team Name</p>
                          <p className="font-semibold text-foreground">{team.teamName || '—'}</p>
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-foreground/60">Team ID</p>
                          <p className="font-semibold text-foreground">{team.verceraTeamId}</p>
                        </div>

                        <div className="flex items-center justify-center py-2">
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <QRCodeSVG value={team.verceraTeamId} size={140} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Members</p>
                          <ul className="space-y-1 text-sm text-foreground/80">
                            {team.members.map((m) => (
                              <li key={m.userId} className="flex items-center justify-between gap-3">
                                <span className="truncate">
                                  {m.fullName}
                                  {m.isLeader ? (
                                    <span className="ml-2 text-xs text-foreground/50">(Leader)</span>
                                  ) : null}
                                </span>
                                <span className="text-xs text-foreground/50">{m.verceraId}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : registration.verceraTeamId ? (
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/70">Team ID</p>
                        <p className="font-semibold text-foreground">{registration.verceraTeamId}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/60">Team info not available yet.</p>
                    )}
                  </div>
                )}

                {/* Info Message */}
                <div className="bg-secondary rounded-lg p-4 text-sm space-y-2">
                  <p className="text-foreground/80">
                    <span className="font-semibold">Note:</span> You need to be logged in to register for this event.
                  </p>
                  <p className="text-foreground/60">
                    After registration, you'll proceed to secure payment via Razorpay.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border"></div>

                {/* Additional Info */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-foreground/60 mb-1">Event Timing</p>
                    <p className="font-semibold text-foreground">{event.time}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 mb-1">Team Size</p>
                    <p className="font-semibold text-foreground">{teamSizeText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
