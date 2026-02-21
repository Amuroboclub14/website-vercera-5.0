'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import { ListChecks, Search } from 'lucide-react'
import { events } from '@/lib/events'

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
}

export default function AdminRegistrationsPage() {
  const fetchWithAuth = useAdminFetch()
  const searchParams = useSearchParams()
  const [registrations, setRegistrations] = useState<Reg[]>([])
  const [loading, setLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState(searchParams.get('eventId') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState('')

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
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (r.eventName || '').toLowerCase().includes(q) ||
      (r.eventId || '').toLowerCase().includes(q) ||
      (r.verceraId || '').toLowerCase().includes(q) ||
      (r.participantName || '').toLowerCase().includes(q) ||
      (r.verceraTeamId || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <ListChecks className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
          Registrations
        </h1>
        <p className="text-foreground/60 mt-1 text-sm">
          All event applications. Filter and search below.
        </p>
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
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-foreground/60">Loading...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">
                    Participant
                  </th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Vercera ID</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-foreground/80 text-xs sm:text-sm">Event</th>
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
                    <td colSpan={8} className="py-8 text-center text-foreground/50">
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
