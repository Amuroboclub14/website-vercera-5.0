'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import {
  Users,
  ListChecks,
  Receipt,
  CheckCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react'

interface Stats {
  totalParticipants: number
  totalTeams: number
  totalRegistrations: number
  paidCount: number
  attendedCount: number
  totalRevenue: number
  eventWise: Record<string, { count: number; revenue: number; attended: number }>
  recentRegistrations: Array<{
    id: string
    eventName?: string
    status?: string
    amount?: number
    createdAt?: string
    userId?: string
  }>
}

export default function AdminDashboardPage() {
  const fetchWithAuth = useAdminFetch()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [fetchWithAuth])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-foreground/70">Loading dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-destructive">Failed to load stats.</p>
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Participants',
      value: stats.totalParticipants,
      icon: Users,
      href: '/admin/participants',
    },
    {
      label: 'Registrations',
      value: stats.totalRegistrations,
      sub: `${stats.paidCount} paid`,
      icon: ListChecks,
      href: '/admin/registrations',
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: Receipt,
      href: '/admin/transactions',
    },
    {
      label: 'Attendance Marked',
      value: stats.attendedCount,
      icon: CheckCircle,
    },
    {
      label: 'Teams',
      value: stats.totalTeams,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-foreground/60 mt-1 text-sm sm:text-base">
          Overview of Vercera 5.0 registrations and revenue
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => {
          const C = card.icon
          const content = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground/70">
                  {card.label}
                </span>
                <C className="h-5 w-5 text-accent/80" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground mt-1 sm:mt-2 truncate">
                {card.value}
              </p>
              {card.sub && (
                <p className="text-xs text-foreground/50 mt-0.5">{card.sub}</p>
              )}
            </>
          )
          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="block p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-card/80 transition-colors touch-manipulation active:scale-[0.98]"
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              className="p-3 sm:p-4 rounded-xl border border-border bg-card"
            >
              {content}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <h2 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            Revenue by Event
          </h2>
          <div className="mt-3 sm:mt-4 space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {Object.entries(stats.eventWise).length === 0 ? (
              <p className="text-foreground/50 text-sm">No data yet</p>
            ) : (
              Object.entries(stats.eventWise).map(([eventId, data]) => (
                <div
                  key={eventId}
                  className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-foreground/80 truncate max-w-[180px]">
                    {eventId}
                  </span>
                  <span className="text-accent font-medium">
                    ₹{data.revenue.toLocaleString('en-IN')} ({data.count})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <h2 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 shrink-0" />
            Recent Registrations
          </h2>
          <div className="mt-3 sm:mt-4 space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {stats.recentRegistrations.length === 0 ? (
              <p className="text-foreground/50 text-sm">No registrations yet</p>
            ) : (
              stats.recentRegistrations.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-foreground/90 font-medium">
                      {r.eventName || r.eventId || '—'}
                    </p>
                    <p className="text-foreground/50 text-xs">
                      {r.status} · ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Link
                    href={`/admin/registrations?highlight=${r.id}`}
                    className="text-accent text-xs hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
