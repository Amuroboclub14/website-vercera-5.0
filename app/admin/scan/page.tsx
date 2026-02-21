'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { QrCode, Search, CheckCircle, Users, Camera, X } from 'lucide-react'
import { useAdminFetch } from '@/hooks/use-admin-fetch'

const QR_READER_ID = 'admin-qr-reader'

interface Participant {
  verceraId: string
  fullName: string
  email: string
  whatsappNumber?: string
  collegeName?: string
}
interface Registration {
  id: string
  eventId: string
  eventName: string
  status: string
  amount: number
  attended?: boolean
}

type ScanResult =
  | { mode: 'participant'; participant: Participant; registrations: Registration[] }
  | {
      mode: 'team'
      team: {
        id: string
        verceraTeamId: string
        teamName: string | null
        eventId: string
        eventName: string
        members: Array<{ userId: string; verceraId: string; fullName: string; email: string; isLeader?: boolean }>
        size: number
      }
      registrations: Array<Registration & { verceraId?: string; isTeamLeader?: boolean }>
    }

const isTeamId = (id: string) => /^VT_/i.test(id.trim())

export default function AdminScanPage() {
  const fetchWithAuth = useAdminFetch()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const scanInProgressRef = useRef(false)

  const performLookup = useCallback(
    async (id: string) => {
      const trimmed = id.trim().toUpperCase()
      if (!trimmed) return
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        if (isTeamId(trimmed)) {
          const res = await fetchWithAuth('/api/admin/scan-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verceraTeamId: trimmed }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || 'Team lookup failed')
            return
          }
          setResult({
            mode: 'team',
            team: data.team,
            registrations: data.registrations || [],
          })
        } else {
          const res = await fetchWithAuth('/api/admin/scan-participant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verceraId: trimmed }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || 'Scan failed')
            return
          }
          setResult({
            mode: 'participant',
            participant: data.participant,
            registrations: data.registrations || [],
          })
        }
        setInput('')
        inputRef.current?.focus()
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    },
    [fetchWithAuth]
  )

  useEffect(() => {
    if (!showScanner) return
    setCameraError(null)
    scanInProgressRef.current = false
    let mounted = true
    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode(QR_READER_ID, { verbose: false })
        scannerRef.current = scanner
        const cameras = await Html5Qrcode.getCameras()
        const cameraId = cameras?.length
          ? cameras[cameras.length - 1].id
          : { facingMode: 'environment' as const }
        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!mounted || scanInProgressRef.current) return
            scanInProgressRef.current = true
            scanner
              .stop()
              .then(() => {
                scannerRef.current = null
                setShowScanner(false)
                performLookup(decodedText)
              })
              .catch(() => {
                scannerRef.current = null
                setShowScanner(false)
                performLookup(decodedText)
              })
          },
          () => {}
        )
      } catch (err) {
        if (mounted) {
          setCameraError(
            err instanceof Error ? err.message : 'Camera access denied or unavailable'
          )
        }
      }
    }
    startCamera()
    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current = null
        }).catch(() => {
          scannerRef.current = null
        })
      }
    }
  }, [showScanner, performLookup])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = input.trim().toUpperCase()
    if (!id) {
      setError('Enter a Vercera ID or Team ID (e.g. VT_XXXXXXXX)')
      return
    }
    await performLookup(id)
  }

  const markAttendance = async (registrationId: string, eventId: string, attended: boolean) => {
    try {
      const res = await fetchWithAuth('/api/admin/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          eventId,
          attended,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult((prev) =>
        prev
          ? {
              ...prev,
              registrations: prev.registrations.map((r) =>
                r.id === registrationId ? { ...r, attended } : r
              ),
            }
          : null
      )
    } catch (err) {
      alert((err as Error).message || 'Failed to update attendance')
    }
  }

  const markTeamAttendance = async (verceraTeamId: string) => {
    try {
      const res = await fetchWithAuth('/api/admin/mark-team-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verceraTeamId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult((prev) =>
        prev && prev.mode === 'team'
          ? {
              ...prev,
              registrations: prev.registrations.map((r) => ({ ...r, attended: true })),
            }
          : prev
      )
    } catch (err) {
      alert((err as Error).message || 'Failed to mark team attendance')
    }
  }

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <QrCode className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
          Ticket scanning
        </h1>
        <p className="text-foreground/60 mt-1 text-sm sm:text-base">
          Enter or scan Vercera ID (participant) or Team ID (VT_…) to look up and mark attendance.
        </p>
      </div>

      <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Vercera ID or Team ID (VT_…)"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-border bg-background text-foreground placeholder:text-foreground/40 font-mono text-base focus:outline-none focus:ring-2 focus:ring-accent touch-manipulation"
            autoFocus
          />
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-3 min-h-[48px] rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 touch-manipulation active:scale-[0.98]"
          >
            {loading ? 'Looking up…' : 'Look up'}
          </button>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex-1 sm:flex-none px-6 py-3 min-h-[48px] rounded-full border border-border bg-background text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" />
            <span className="sm:inline">Scan QR</span>
          </button>
        </div>
      </form>

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
          <div className="relative w-full max-h-[90vh] sm:max-h-none sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden bg-card border border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30 shrink-0">
              <span className="font-medium text-foreground">Scan QR code</span>
              <button
                type="button"
                onClick={() => {
                  if (scannerRef.current) {
                    scannerRef.current.stop().then(() => {
                      scannerRef.current = null
                      setShowScanner(false)
                    }).catch(() => {
                      scannerRef.current = null
                      setShowScanner(false)
                    })
                  } else {
                    setShowScanner(false)
                  }
                }}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-full hover:bg-secondary text-foreground touch-manipulation flex items-center justify-center"
                aria-label="Close scanner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 overflow-auto min-h-0 flex-1">
              {cameraError ? (
                <p className="text-sm text-destructive py-4">{cameraError}</p>
              ) : (
                <div id={QR_READER_ID} className="rounded-xl overflow-hidden [&>div]:!border-0 [& video]:rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive text-sm">
          {error}
        </div>
      )}

      {result && result.mode === 'participant' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h2 className="font-semibold text-foreground">{result.participant.fullName}</h2>
            <p className="text-sm text-foreground/70 mt-0.5">
              {result.participant.verceraId} · {result.participant.email}
            </p>
            {result.participant.collegeName && (
              <p className="text-xs text-foreground/50 mt-1">
                {result.participant.collegeName}
              </p>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground/80 mb-3">
              Registrations
            </h3>
            {result.registrations.length === 0 ? (
              <p className="text-foreground/50 text-sm">No registrations.</p>
            ) : (
              <ul className="space-y-2">
                {result.registrations.map((reg) => (
                  <li
                    key={reg.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {reg.eventName}
                      </p>
                      <p className="text-xs text-foreground/50">
                        {reg.status} · ₹{reg.amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.attended ? (
                        <span className="text-accent text-sm flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Attended
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            markAttendance(reg.id, reg.eventId, true)
                          }
                          className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors"
                        >
                          Mark attended
                        </button>
                      )}
                      {reg.attended && (
                        <button
                          onClick={() =>
                            markAttendance(reg.id, reg.eventId, false)
                          }
                          className="text-foreground/50 hover:text-destructive text-xs"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {result && result.mode === 'team' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                {result.team.teamName || 'Team'}
              </h2>
              <p className="text-sm text-foreground/70 mt-0.5 font-mono">
                {result.team.verceraTeamId} · {result.team.eventName}
              </p>
            </div>
            {result.registrations.some((r) => !r.attended) ? (
              <button
                onClick={() => markTeamAttendance(result.team.verceraTeamId)}
                className="px-4 py-2 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                Mark whole team attended
              </button>
            ) : (
              <span className="text-accent text-sm flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> All attended
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground/80 mb-3">
              Team members ({result.team.size})
            </h3>
            <ul className="space-y-2">
              {result.registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {result.team.members.find((m) => m.verceraId === reg.verceraId)?.fullName ?? reg.verceraId ?? '—'}
                    </p>
                    <p className="text-xs text-foreground/50 font-mono">
                      {reg.verceraId} · {reg.status} · ₹{reg.amount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {reg.attended ? (
                    <span className="text-accent text-sm flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Attended
                    </span>
                  ) : (
                    <span className="text-foreground/50 text-sm">Not marked</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
