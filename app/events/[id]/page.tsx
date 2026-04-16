'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { useEvent } from '@/hooks/use-events'
import { ArrowLeft, Clock, MapPin, Users, Trophy, Check, BadgeCheck, QrCode, FileText, Cpu, Gamepad2, ExternalLink, Sparkles } from 'lucide-react'
import { formatPrizeAmount } from '@/lib/format-prize'
import { collection, getDocs, query, where } from 'firebase/firestore'
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
  leaderUserId?: string
}

export default function EventDetailPage({ params }: Props) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { id } = use(params)
  const { event, loading } = useEvent(id)
  const [isRegistering, setIsRegistering] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [registration, setRegistration] = useState<RegistrationDoc | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [team, setTeam] = useState<TeamDoc | null>(null)
  const [teamFormMode, setTeamFormMode] = useState<'idle' | 'form' | 'join'>('idle')
  // Prevent UI from reverting back to "Register" for team events during refreshes
  // when multiple registration docs exist for the same user+event.
  const [teamEvidenceLocked, setTeamEvidenceLocked] = useState(false)
  const [lockedVerceraTeamId, setLockedVerceraTeamId] = useState<string | null>(null)
  const [teamNameInput, setTeamNameInput] = useState('')
  const [teamCodeInput, setTeamCodeInput] = useState('')
  const [teamActionLoading, setTeamActionLoading] = useState(false)
  const [teamActionError, setTeamActionError] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [registrationRefresh, setRegistrationRefresh] = useState(0)
  const [eligibleFromPack, setEligibleFromPack] = useState(false)
  const [addingFromPack, setAddingFromPack] = useState(false)
  const registrationLoadSeq = useRef(0)

  const teamSizeText = useMemo(() => {
    if (!event) return 'Solo'
    const isTeam = event.isTeamEvent ?? false
    if (!isTeam) return 'Solo'
    const min = event.teamSizeMin ?? 1
    const max = event.teamSizeMax ?? min
    return min === max ? `${min}` : `${min}-${max}`
  }, [event])

  useEffect(() => {
    if (!user || !event) {
      setEligibleFromPack(false)
      return
    }
    user.getIdToken().then((token) =>
      fetch('/api/me/eligible-events', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          const ids = (d.eligible ?? []).map((e: { eventId: string }) => e.eventId)
          setEligibleFromPack(ids.includes(event.id))
        })
        .catch(() => setEligibleFromPack(false))
    )
  }, [user, event?.id])

  useEffect(() => {
    if (!user || !event) {
      setRegistration(null)
      setTeam(null)
      setTeamEvidenceLocked(false)
      setLockedVerceraTeamId(null)
      return
    }

    const run = async () => {
      const seq = ++registrationLoadSeq.current
      setRegLoading(true)
      setTeamLoading(false)

      try {
        const regsRef = collection(db, 'registrations')
        // Multiple registrations can exist for the same user+event (retries, pack eligibility vs paid registration).
        // Fetch all matches and pick the best one for correct UI (especially after team form/join).
        const q = query(regsRef, where('userId', '==', user.uid), where('eventId', '==', event.id))
        const snap = await getDocs(q)
        if (seq !== registrationLoadSeq.current) return
        if (snap.empty) {
          setRegistration(null)
          setTeam(null)
          setTeamEvidenceLocked(false)
          setLockedVerceraTeamId(null)
          return
        }

        const toMillis = (v: unknown): number => {
          if (v == null) return -Infinity
          if (typeof v === 'number') return v
          if (typeof v === 'string') {
            const t = Date.parse(v)
            return Number.isFinite(t) ? t : -Infinity
          }
          if (typeof v === 'object') {
            const obj = v as Record<string, unknown>
            const maybeToMillis = (obj as { toMillis?: unknown }).toMillis
            if (typeof maybeToMillis === 'function') {
              try {
                const t = (maybeToMillis as () => number)()
                return Number.isFinite(t) ? t : -Infinity
              } catch {
                return -Infinity
              }
            }
            if (typeof obj.seconds === 'number') return obj.seconds * 1000
            if (typeof obj._seconds === 'number') return obj._seconds * 1000
          }
          return -Infinity
        }

        const candidates = snap.docs.map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>
          const rawStatus = d.status == null ? '' : String(d.status)
          const status = rawStatus.trim()

          const rawTeamId = d.teamId == null ? '' : String(d.teamId)
          const teamId = rawTeamId.trim() ? rawTeamId.trim() : undefined

          const rawVerceraTeamId = d.verceraTeamId == null ? '' : String(d.verceraTeamId)
          const verceraTeamId = rawVerceraTeamId.trim() ? rawVerceraTeamId.trim() : undefined

          return {
            id: docSnap.id,
            status: status || undefined,
            registrationDate: (d.registrationDate as string | undefined) ?? undefined,
            amount: (d.amount as number | undefined) ?? undefined,
            isTeamEvent: Boolean(d.isTeamEvent),
            isTeamLeader: Boolean(d.isTeamLeader),
            teamId,
            verceraTeamId,
            createdAtMs: toMillis(d.createdAt),
          }
        })

        // Team UI must be stable after refresh:
        // derive evidence from ANY matching registration doc, not from only the selected one.
        const evidenceCandidates = candidates.filter((c) => c.teamId || c.verceraTeamId)
        const hasAnyTeamEvidence = evidenceCandidates.length > 0
        if (hasAnyTeamEvidence) {
          const withNewestCode = evidenceCandidates
            .filter((c) => c.verceraTeamId)
            .sort((a, b) => (b.createdAtMs ?? -Infinity) - (a.createdAtMs ?? -Infinity) || String(b.id).localeCompare(String(a.id)))
          const code = withNewestCode[0]?.verceraTeamId ?? evidenceCandidates[0]?.verceraTeamId ?? evidenceCandidates[0]?.teamId ?? null
          setTeamEvidenceLocked(true)
          setLockedVerceraTeamId(code)
        }

        const isPaid = (s?: string) => {
          const t = (s ?? '').toLowerCase().trim()
          return t === 'paid' || t === 'completed'
        }

        // Deterministic selection for stable UI after refresh:
        // 1) Prefer any team evidence (teamId OR verceraTeamId)
        // 2) If both have team evidence, prefer paid/completed
        // 3) If neither has team evidence, prefer paid/completed
        // 4) Then newest createdAt
        // 5) Then newest registrationDate
        // 6) Then stable id
        const pick = [...candidates].sort((a, b) => {
          const aPaid = isPaid(a.status) ? 1 : 0
          const bPaid = isPaid(b.status) ? 1 : 0

          const aHasTeamEvidence = a.teamId || a.verceraTeamId ? 1 : 0
          const bHasTeamEvidence = b.teamId || b.verceraTeamId ? 1 : 0

          if (aHasTeamEvidence !== bHasTeamEvidence) return bHasTeamEvidence - aHasTeamEvidence
          if (aPaid !== bPaid) return bPaid - aPaid

          const aTime = a.createdAtMs ?? -Infinity
          const bTime = b.createdAtMs ?? -Infinity
          if (aTime !== bTime) return bTime - aTime

          const aRegDate = a.registrationDate ? Date.parse(a.registrationDate) : -Infinity
          const bRegDate = b.registrationDate ? Date.parse(b.registrationDate) : -Infinity
          if (aRegDate !== bRegDate) return bRegDate - aRegDate

          // Final tie-breaker to prevent switching between docs after refresh
          return String(b.id).localeCompare(String(a.id))
        })[0]

        const reg: RegistrationDoc = {
          id: pick.id,
          status: pick.status,
          registrationDate: pick.registrationDate,
          amount: pick.amount,
          isTeamEvent: pick.isTeamEvent,
          isTeamLeader: pick.isTeamLeader,
          teamId: pick.teamId,
          verceraTeamId: pick.verceraTeamId,
        }

        setRegistration(reg)
        // Fetch team through server API (Firebase Admin) so Firestore client rule/network issues
        // cannot hide team details in UI.
        setTeamLoading(true)
        try {
          const token = await user.getIdToken()
          const teamRes = await fetch(`/api/team/my?eventId=${encodeURIComponent(event.id)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const teamData = await teamRes.json().catch(() => ({}))
          if (seq !== registrationLoadSeq.current) return
          if (teamRes.ok && teamData.team) {
            const t = teamData.team as {
              teamName?: string | null
              verceraTeamId?: string
              members?: TeamMember[]
              size?: number
              leaderUserId?: string | null
            }
            setTeam({
              teamName: t.teamName ?? null,
              verceraTeamId: String(t.verceraTeamId || ''),
              members: t.members ?? [],
              size: t.size ?? undefined,
              leaderUserId: t.leaderUserId ?? undefined,
            })
          } else if (hasAnyTeamEvidence) {
            // Keep lock/code to prevent UI flip; show fallback Team ID/QR while data resolves.
            setTeam(null)
          } else {
            setTeam(null)
          }
        } catch {
          // Keep lock/code fallback if we have evidence.
          if (!hasAnyTeamEvidence) setTeam(null)
        }
      } catch {
        // Keep the latest known registration/team evidence on transient failures.
      } finally {
        if (seq === registrationLoadSeq.current) {
          setRegLoading(false)
          setTeamLoading(false)
        }
      }
    }

    run()
  }, [user, event, registrationRefresh])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-foreground/60">Loading event…</div>
        <Footer />
      </main>
    )
  }

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
              className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-all"
            >
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const registeredCount = event.registeredCount ?? 0
  const spotsAvailable = event.maxParticipants - registeredCount
  const isTeamEvent = event.isTeamEvent ?? false
  const statusNorm = String(registration?.status ?? '').toLowerCase().trim()
  const isPaidRegistration = registration && (statusNorm === 'paid' || statusNorm === 'completed')
  // Treat team evidence as authoritative only when the lock is enabled.
  // We clear the lock if the team document cannot be fetched (e.g. user deleted/abandoned it).
  const hasTeamEvidence = teamEvidenceLocked

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/login?redirect=/events/${event.id}`)
    } else {
      router.push(`/checkout/${event.id}`)
    }
  }

  const handleFormTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return
    setTeamActionError(null)
    setTeamActionLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/team/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: event.id, teamName: teamNameInput.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to form team')
      setTeamFormMode('idle')
      setTeamNameInput('')
      setRegistrationRefresh((c) => c + 1)
    } catch (err) {
      setTeamActionError(err instanceof Error ? err.message : 'Failed to form team')
    } finally {
      setTeamActionLoading(false)
    }
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return
    setTeamActionError(null)
    setTeamActionLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: event.id, teamCode: teamCodeInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join team')
      setTeamFormMode('idle')
      setTeamCodeInput('')
      setRegistrationRefresh((c) => c + 1)
    } catch (err) {
      setTeamActionError(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setTeamActionLoading(false)
    }
  }

  const handleRemoveMember = async (memberUserId: string) => {
    if (!user || !event || !team || removingMemberId) return
    setTeamActionError(null)
    setRemovingMemberId(memberUserId)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/team/remove-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: event.id, memberUserId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to remove member')
      setRegistrationRefresh((c) => c + 1)
    } catch (err) {
      setTeamActionError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemovingMemberId(null)
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
              <div className="w-full h-96 bg-secondary rounded-xl overflow-hidden border border-border flex items-center justify-center">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-foreground/30">
                    {event.category === 'technical' ? <Cpu className="w-24 h-24" strokeWidth={1} /> : <Gamepad2 className="w-24 h-24" strokeWidth={1} />}
                  </span>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <p className="font-semibold text-foreground">{formatPrizeAmount(event.prizePool)}</p>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-foreground">About this Event</h2>
                <p className="text-foreground/70 leading-relaxed">{event.longDescription}</p>
              </div>

              {/* Flagship sponsor block */}
              {event.flagship && event.flagshipSponsor?.name && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">Flagship Sponsor</h2>
                  <a
                    href={event.flagshipSponsor.websiteUrl || undefined}
                    target={event.flagshipSponsor.websiteUrl ? '_blank' : undefined}
                    rel={event.flagshipSponsor.websiteUrl ? 'noopener noreferrer' : undefined}
                    className="group block rounded-xl border border-accent/40 bg-gradient-to-r from-accent/10 to-secondary p-5 hover:border-accent/70 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {(event.flagshipSponsor.categories?.length
                            ? event.flagshipSponsor.categories
                            : ['Event Sponsor', 'In-Kind Sponsor']
                          ).map((cat) => (
                            <span key={cat} className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-foreground/70">Sponsored by</p>
                        <p className="text-2xl font-display font-bold text-foreground">
                          {event.flagshipSponsor.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {event.flagshipSponsor.logoUrl ? (
                          <img
                            src={event.flagshipSponsor.logoUrl}
                            alt={event.flagshipSponsor.name}
                            className="w-16 h-16 object-contain rounded-lg border border-border/50 bg-background/70 p-2"
                          />
                        ) : null}
                        {event.flagshipSponsor.websiteUrl ? (
                          <span className="inline-flex items-center gap-1 text-accent text-sm font-medium">
                            Visit sponsor
                            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </a>
                </div>
              )}

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
                      <p className="font-display text-3xl font-bold text-accent">{formatPrizeAmount(prize.amount)}</p>
                    </div>
                  ))}
                </div>
                {event.specialCategoryAward?.name && (
                  <div className="rounded-xl border border-accent/50 bg-gradient-to-r from-accent/15 via-secondary to-secondary/70 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {event.specialCategoryAward.logoUrl ? (
                        <img
                          src={event.specialCategoryAward.logoUrl}
                          alt={event.specialCategoryAward.name}
                          className="w-32 h-32 object-contain rounded-lg border border-border/60 bg-background/70 p-2"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-border/60 bg-background/70 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-accent" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">
                          Sponsor-Declared Category Winner
                        </p>
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                          {event.specialCategoryAward.name}
                        </h3>
                        {event.specialCategoryAward.description ? (
                          <p className="text-foreground/75 mt-2 leading-relaxed">
                            {event.specialCategoryAward.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rulebook & attachments (optional) */}
              {((event.rulebookUrls?.length ?? 0) > 0 || event.rulebookUrl) && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">Rulebook & documents</h2>
                  <div className="bg-secondary border border-border rounded-xl p-6 space-y-3">
                    {(event.rulebookUrls?.length ? event.rulebookUrls : event.rulebookUrl ? [event.rulebookUrl] : []).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
                      >
                        <FileText size={20} />
                        {event.rulebookUrls && event.rulebookUrls.length > 1 ? `Rulebook / doc ${i + 1}` : 'View / Download Rulebook'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {((event.attachmentUrls?.length ?? 0) > 0) && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">Other attachments</h2>
                  <div className="bg-secondary border border-border rounded-xl p-6 space-y-3">
                    {event.attachmentUrls!.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 bg-secondary border border-border text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                      >
                        <FileText size={20} />
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Registration Card */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
                {/* Registered Status */}
                {regLoading ? (
                  <div className="bg-secondary rounded-lg p-4 text-sm text-foreground/70">
                    Checking your registration…
                  </div>
                ) : isPaidRegistration || team || teamLoading ? (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-accent font-semibold">
                      <BadgeCheck size={18} />
                      Registered
                    </div>
                    <p className="text-foreground/70 text-sm">
                      {registration?.isTeamEvent ? 'Team registration confirmed.' : 'Your registration is confirmed.'}
                    </p>
                    {registration?.registrationDate && (
                      <p className="text-xs text-foreground/60">Date: {registration?.registrationDate}</p>
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

                {/* CTA Button */}
                {!regLoading && (
                  <>
                    {teamLoading || team || hasTeamEvidence ? (
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-accent/20 text-accent rounded-full font-bold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <BadgeCheck size={18} />
                        Registered
                      </button>
                    ) : isPaidRegistration ? (
                      <button
                        disabled
                        className="w-full px-6 py-3 bg-accent/20 text-accent rounded-full font-bold cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <BadgeCheck size={18} />
                        Registered
                      </button>
                    ) : spotsAvailable > 0 ? eligibleFromPack ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user || addingFromPack) return
                            setAddingFromPack(true)
                            try {
                              const token = await user.getIdToken()
                              const res = await fetch('/api/registration/add-from-pack', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ eventId: event.id }),
                              })
                              if (res.ok) {
                                setRegistrationRefresh((n) => n + 1)
                                setEligibleFromPack(false)
                              } else {
                                const err = await res.json().catch(() => ({}))
                                alert(err.error || 'Failed to add event')
                              }
                            } catch {
                              alert('Request failed')
                            } finally {
                              setAddingFromPack(false)
                            }
                          }}
                          disabled={addingFromPack}
                          className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-full font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                          {addingFromPack ? 'Adding…' : 'Add to my events'}
                        </button>
                        <p className="text-center text-foreground/60 text-xs">Included in your pack — no extra payment</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          onClick={handleRegisterClick}
                          disabled={isRegistering}
                          className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-full font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRegistering ? 'Processing...' : 'Register for this event'}
                        </button>
                        <p className="text-center text-foreground/60 text-xs">Pay the fee above to register</p>
                      </div>
                    ) : (
                      <button disabled className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-full font-bold cursor-not-allowed">
                        Registration Closed
                      </button>
                    )}
                  </>
                )}

                {/* Form / Join team (registered, team event, not in a team yet) */}
                {isPaidRegistration && isTeamEvent && !teamLoading && !team && !hasTeamEvidence && (
                  <div id="team" className="bg-secondary/50 border border-border/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Users size={18} className="text-accent" />
                      Form or join a team
                    </div>
                    <p className="text-sm text-foreground/70">
                      You&apos;re registered. Create a team or join one with a Team ID.
                    </p>
                    {teamActionError && (
                      <p className="text-sm text-destructive">{teamActionError}</p>
                    )}
                    {teamFormMode === 'idle' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTeamFormMode('form')}
                          className="flex-1 px-3 py-2 rounded-lg border border-accent text-accent font-medium hover:bg-accent/10"
                        >
                          Form team
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamFormMode('join')}
                          className="flex-1 px-3 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-secondary"
                        >
                          Join team
                        </button>
                      </div>
                    )}
                    {teamFormMode === 'form' && (
                      <form onSubmit={handleFormTeam} className="space-y-2">
                        <input
                          type="text"
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          placeholder="Team name (optional)"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          disabled={teamActionLoading}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setTeamFormMode('idle'); setTeamActionError(null); }}
                            className="px-3 py-2 rounded-lg border border-border text-foreground text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={teamActionLoading}
                            className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
                          >
                            {teamActionLoading ? 'Creating…' : 'Create team'}
                          </button>
                        </div>
                      </form>
                    )}
                    {teamFormMode === 'join' && (
                      <form onSubmit={handleJoinTeam} className="space-y-2">
                        <input
                          type="text"
                          value={teamCodeInput}
                          onChange={(e) => setTeamCodeInput(e.target.value)}
                          placeholder="Team ID (e.g. VT_XXXXXXXX)"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          disabled={teamActionLoading}
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setTeamFormMode('idle'); setTeamActionError(null); setTeamCodeInput(''); }}
                            className="px-3 py-2 rounded-lg border border-border text-foreground text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={teamActionLoading}
                            className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
                          >
                            {teamActionLoading ? 'Joining…' : 'Join team'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Team Info */}
                {(teamLoading || team || hasTeamEvidence) && (
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
                                <div className="min-w-0 flex-1">
                                  <span className="truncate block">
                                    {m.fullName}
                                    {m.isLeader ? (
                                      <span className="ml-2 text-xs text-foreground/50">(Leader)</span>
                                    ) : null}
                                  </span>
                                  <span className="text-xs text-foreground/50">{m.verceraId}</span>
                                </div>
                                {team.leaderUserId === user?.uid && !m.isLeader ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(m.userId)}
                                    disabled={removingMemberId === m.userId}
                                    className="px-2 py-1 rounded border border-destructive/40 text-destructive text-xs hover:bg-destructive/10 disabled:opacity-60"
                                  >
                                    {removingMemberId === m.userId ? 'Removing…' : 'Remove'}
                                  </button>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                          {team.leaderUserId === user?.uid ? (
                            <p className="text-xs text-foreground/50">
                              As team leader, you can remove members from this event team.
                            </p>
                          ) : null}
                        </div>
                      </>
                    ) : (lockedVerceraTeamId || registration?.verceraTeamId) ? (
                      <div className="space-y-3">
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground/60">Team ID</p>
                          <p className="font-semibold text-foreground">{lockedVerceraTeamId || registration?.verceraTeamId}</p>
                        </div>
                        <div className="flex items-center justify-center py-1">
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <QRCodeSVG value={lockedVerceraTeamId || registration?.verceraTeamId || ''} size={140} />
                          </div>
                        </div>
                        <p className="text-sm text-foreground/60">
                          Team name and members will appear once the team document loads.
                        </p>
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
