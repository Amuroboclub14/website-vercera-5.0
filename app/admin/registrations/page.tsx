'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useWheelScroll } from '@/hooks/use-wheel-scroll'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import { ListChecks, Search } from 'lucide-react'
import type { EventRecord } from '@/lib/events-types'

interface Reg {
  id: string
  eventId?: string
  eventName?: string
  status?: string
  amount?: number
  attended?: boolean
  userId?: string
  verceraId?: string
  participantName?: string
  participantEmail?: string | null
  verceraTeamId?: string
  teamId?: string
  createdAt?: string
  razorpayOrderId?: string
  bundleId?: string
  bundleType?: string
  bundleName?: string | null
  hasAccommodation?: boolean
}

export default function AdminRegistrationsPage() {
  const fetchWithAuth = useAdminFetch()
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<Reg[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState(searchParams.get('eventId') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [accommodationFilter, setAccommodationFilter] = useState(searchParams.get('accommodation') || '')
  const [search, setSearch] = useState('')
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
    const params = new URLSearchParams()
    if (eventFilter) params.set('eventId', eventFilter)
    if (statusFilter) params.set('status', statusFilter)
    params.set('limit', '300')
    fetchWithAuth(`/api/admin/registrations?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setRegistrations(data.registrations || [])
      })
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false))
  }, [eventFilter, statusFilter, fetchWithAuth])

  const filtered = registrations.filter((r) => {
    if (accommodationFilter === 'yes' && !r.hasAccommodation) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (r.eventName || '').toLowerCase().includes(q) ||
      (r.eventId || '').toLowerCase().includes(q) ||
      (r.verceraId || '').toLowerCase().includes(q) ||
      (r.participantName || '').toLowerCase().includes(q) ||
      (r.verceraTeamId || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.bundleName || '').toLowerCase().includes(q)
    )
  })

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert('No registrations to export for the current filters.')
      return
    }

    const escape = (value: unknown) => {
      const str = value == null ? '' : String(value)
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const header = [
      'Participant',
      'Vercera ID',
      'Email',
      'Event',
      'Pack',
      'Accommodation',
      'Status',
      'Amount',
      'Attended',
      'Order ID',
      'Created At',
    ]

    const lines = [
      header.join(','),
      ...filtered.map((r) =>
        [
          r.participantName ?? '',
          r.verceraId ?? '',
          r.participantEmail ?? '',
          r.eventName || r.eventId || '',
          r.bundleName ?? '',
          r.hasAccommodation ? 'Yes' : 'No',
          r.status ?? '',
          r.amount != null ? String(r.amount) : '',
          r.attended ? 'Yes' : 'No',
          r.razorpayOrderId ?? '',
          r.createdAt ?? '',
        ]
          .map(escape)
          .join(',')
      ),
    ]

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'registrations.csv')
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
            <ListChecks className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            Registrations
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            All event applications. Filter and search below.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            type="text"
            placeholder="Search name, Vercera ID, team ID, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-border bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-accent touch-manipulation"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="flex-1 min-w-[120px] px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent touch-manipulation"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 min-w-[120px] px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent touch-manipulation"
          >
            <option value="">All statuses</option>
            <option value="registered">Registered</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={accommodationFilter}
            onChange={(e) => setAccommodationFilter(e.target.value)}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-full border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent touch-manipulation"
          >
            <option value="">All packs</option>
            <option value="yes">Accommodation only</option>
          </select>
        </div>
      </div>

      {!loading && accommodationFilter === 'yes' && filtered.length > 0 && (
        <p className="text-sm text-foreground/70">
          <span className="font-semibold text-foreground">
            {new Set(filtered.map((r) => r.userId).filter(Boolean)).size}
          </span>{' '}
          participant{new Set(filtered.map((r) => r.userId).filter(Boolean)).size === 1 ? '' : 's'} with accommodation
        </p>
      )}

      {loading ? (
        <div className="py-12 text-center text-foreground/60">Loading...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden -mx-4 sm:mx-0 flex flex-col max-h-[70vh] min-h-0">
          <div
            ref={tableScrollRef}
            className="scroll-area-touch flex-1 min-h-0 overflow-x-auto overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
            tabIndex={0}
          >
            <table className="w-full text-sm min-w-[800px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">
                    Participant
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Vercera ID</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Event</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Pack</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Team</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Status</th>
                  <th className="text-right py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Amount</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Attended</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-foreground/50">
                      No registrations match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-foreground text-xs sm:text-sm">
                        {r.participantName || '—'}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-foreground/80 font-mono text-xs">
                        {r.verceraId || '—'}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-foreground text-xs sm:text-sm">
                        {r.eventName || r.eventId || '—'}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm">
                        {r.hasAccommodation ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium" title="All-in-one (accommodation + all events)">
                            Accommodation
                          </span>
                        ) : r.bundleName ? (
                          <span className="text-foreground/80">{r.bundleName}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono text-xs text-foreground/70">
                        {r.verceraTeamId || '—'}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'paid' || r.status === 'completed'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-secondary text-foreground/70'
                          }`}
                        >
                          {r.status || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-medium text-xs sm:text-sm">
                        ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                        {r.attended ? (
                          <span className="text-accent text-xs sm:text-sm">Yes</span>
                        ) : (
                          <span className="text-foreground/50 text-xs sm:text-sm">No</span>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-foreground/50 text-xs">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString('en-IN')
                          : '—'}
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
