'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Search, UsersRound } from 'lucide-react'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import type { EventRecord } from '@/lib/events-types'
import { useWheelScroll } from '@/hooks/use-wheel-scroll'

interface TeamMember {
  userId?: string
  verceraId?: string
  fullName?: string
  email?: string
  isLeader?: boolean
}

interface TeamRow {
  id: string
  verceraTeamId: string
  teamName: string | null
  eventId: string | null
  eventName: string | null
  size: number
  members: TeamMember[]
  leaderName: string | null
  leaderEmail: string | null
  amountPaid: number
  razorpayOrderId: string | null
  createdAt: string | null
  registrationCount: number
  attendedCount: number
  pendingAttendanceCount: number
}

export default function AdminTeamsPage() {
  const fetchWithAuth = useAdminFetch()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const tableScrollRef = useRef<HTMLDivElement>(null)
  useWheelScroll(tableScrollRef, !loading)

  useEffect(() => {
    fetchWithAuth('/api/admin/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setEvents(data.events || [])
      })
      .catch(() => setEvents([]))
  }, [fetchWithAuth])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '300')
    if (eventFilter) params.set('eventId', eventFilter)
    if (search.trim()) params.set('search', search.trim())

    fetchWithAuth(`/api/admin/teams?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setTeams(data.teams || [])
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [fetchWithAuth, eventFilter, search])

  const handleExportCsv = () => {
    if (teams.length === 0) {
      alert('No teams to export for current filters.')
      return
    }
    const escape = (value: unknown) => {
      const str = value == null ? '' : String(value)
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
      return str
    }
    const header = [
      'Vercera Team ID',
      'Team Name',
      'Event',
      'Leader',
      'Leader Email',
      'Size',
      'Members',
      'Registrations',
      'Attended',
      'Pending Attendance',
      'Amount Paid',
      'Razorpay Order ID',
      'Created At',
    ]
    const lines = [
      header.join(','),
      ...teams.map((t) =>
        [
          t.verceraTeamId,
          t.teamName ?? '',
          t.eventName ?? t.eventId ?? '',
          t.leaderName ?? '',
          t.leaderEmail ?? '',
          t.size,
          t.members
            .map((m) => `${m.fullName ?? '—'} (${m.verceraId ?? m.userId ?? '—'})${m.isLeader ? ' [L]' : ''}`)
            .join(' | '),
          t.registrationCount,
          t.attendedCount,
          t.pendingAttendanceCount,
          t.amountPaid,
          t.razorpayOrderId ?? '',
          t.createdAt ?? '',
        ]
          .map(escape)
          .join(',')
      ),
    ]
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'teams.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersRound className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            Teams
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            View team metadata, members, attendance, and payment context.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search team ID, name, event, member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-border bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="min-w-[180px] px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-foreground/60">Loading teams...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden -mx-4 sm:mx-0 flex flex-col max-h-[70vh] min-h-0">
          <div
            ref={tableScrollRef}
            className="scroll-area-touch flex-1 min-h-0 overflow-x-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            tabIndex={0}
          >
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Leader</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Members</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground/80">Size</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground/80">Regs</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground/80">Attended</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground/80">Pending</th>
                  <th className="text-right py-3 px-4 font-medium text-foreground/80">Paid</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Created</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-foreground/50">
                      No teams found.
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono text-accent text-xs">{t.verceraTeamId || '—'}</p>
                        <p className="text-foreground text-sm">{t.teamName || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-foreground/90">{t.eventName || t.eventId || '—'}</td>
                      <td className="py-3 px-4">
                        <p className="text-foreground">{t.leaderName || '—'}</p>
                        <p className="text-foreground/60 text-xs">{t.leaderEmail || '—'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-[360px] space-y-1">
                          {t.members.length === 0 ? (
                            <p className="text-xs text-foreground/50">—</p>
                          ) : (
                            t.members.map((m, i) => (
                              <p key={`${t.id}-m-${i}`} className="text-xs text-foreground/85 break-words">
                                <span className="font-medium">{m.fullName || '—'}</span>
                                {m.isLeader ? ' (L)' : ''} · {m.verceraId || m.userId || '—'}
                                {m.email ? ` · ${m.email}` : ''}
                              </p>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{t.size}</td>
                      <td className="py-3 px-4 text-right">{t.registrationCount}</td>
                      <td className="py-3 px-4 text-right">{t.attendedCount}</td>
                      <td className="py-3 px-4 text-right">{t.pendingAttendanceCount}</td>
                      <td className="py-3 px-4 text-right text-accent font-medium">₹{t.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-mono text-xs text-foreground/70">{t.razorpayOrderId || '—'}</td>
                      <td className="py-3 px-4 text-xs text-foreground/60">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

