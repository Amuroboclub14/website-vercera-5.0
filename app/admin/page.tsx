'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useWheelScroll } from '@/hooks/use-wheel-scroll'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import {
  Users,
  ListChecks,
  Receipt,
  Wallet,
  CheckCircle,
  TrendingUp,
  Calendar,
  Package,
} from 'lucide-react'

interface PackPurchase {
  id?: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  bundleId: string | null
  bundleName: string | null
  amount: number
  createdAt: string | null
  eventsAddedCount: number
}

interface Stats {
  totalParticipants: number
  totalTeams: number
  totalRegistrations: number
  paidCount: number
  /** Distinct participant profiles with at least one pack or event transaction (amount > 0). */
  distinctPayingParticipants: number
  /** Distinct participants who purchased at least one bundle (pack tx, amount > 0). */
  distinctBundleBuyers: number
  attendedCount: number
  totalRevenue: number
  eventWise: Record<string, { count: number; revenue: number; attended: number }>
  eventNames?: Record<string, string>
  recentRegistrations: Array<{
    id: string
    eventId?: string
    eventName?: string
    status?: string
    amount?: number
    createdAt?: string
    userId?: string
  }>
  packPurchases?: PackPurchase[]
}

export default function AdminDashboardPage() {
  const fetchWithAuth = useAdminFetch()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const revenueScrollRef = useRef<HTMLDivElement>(null)
  const recentScrollRef = useRef<HTMLDivElement>(null)
  useWheelScroll(revenueScrollRef, !!stats)
  useWheelScroll(recentScrollRef, !!stats)

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
      label: 'Event entries',
      value: stats.totalRegistrations,
      sub: `${stats.paidCount} with paid status (incl. bundle picks at ₹0)`,
      icon: ListChecks,
      href: '/admin/registrations',
    },
    {
      label: 'Paid participants',
      value: stats.distinctPayingParticipants ?? 0,
      sub: 'Distinct people with a pack or event payment',
      icon: Wallet,
      href: '/admin/transactions',
    },
    {
      label: 'Bundle buyers',
      value: stats.distinctBundleBuyers ?? 0,
      sub: 'People who purchased a pack',
      icon: Package,
      href: '/admin/bundles',
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

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4">
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
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col min-h-0">
          <h2 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2 flex-shrink-0">
            <Calendar className="h-4 w-4 shrink-0" />
            Revenue by Event
          </h2>
          <div className="mt-3 sm:mt-4 flex-1 min-h-0 max-h-48 sm:max-h-64 flex flex-col overflow-hidden">
            <div
              ref={revenueScrollRef}
              className="scroll-area-touch flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
              tabIndex={0}
            >
              {Object.entries(stats.eventWise).length === 0 ? (
                <p className="text-foreground/50 text-sm">No data yet</p>
              ) : (
                Object.entries(stats.eventWise).map(([eventId, data]) => (
                  <div
                    key={eventId}
                    className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="text-foreground/80 truncate max-w-[180px]">
                      {stats.eventNames?.[eventId] ?? eventId}
                    </span>
                    <span className="text-accent font-medium">
                      ₹{data.revenue.toLocaleString('en-IN')} ({data.count})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col min-h-0">
          <h2 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2 flex-shrink-0">
            <ListChecks className="h-4 w-4 shrink-0" />
            Recent Registrations
          </h2>
          <div className="mt-3 sm:mt-4 flex-1 min-h-0 max-h-48 sm:max-h-64 flex flex-col overflow-hidden">
            <div
              ref={recentScrollRef}
              className="scroll-area-touch flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
              tabIndex={0}
            >
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

      {/* Pack purchases — who bought which pack, events added count */}
      {(stats.packPurchases?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col min-h-0">
          <h2 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2 flex-shrink-0 mb-3">
            <Package className="h-4 w-4 shrink-0" />
            Pack purchases
          </h2>
          <p className="text-foreground/60 text-xs mb-3">Who bought which pack and how many events they&apos;ve added to their profile (even if none yet).</p>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-foreground/80">Participant</th>
                  <th className="text-left py-2 px-2 font-medium text-foreground/80">Pack</th>
                  <th className="text-right py-2 px-2 font-medium text-foreground/80">Amount</th>
                  <th className="text-center py-2 px-2 font-medium text-foreground/80">Events added</th>
                  <th className="text-left py-2 px-2 font-medium text-foreground/80">Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats.packPurchases ?? []).map((p) => (
                  <tr
                    key={p.id ?? `${p.userId ?? ''}|${p.bundleId ?? ''}|${p.createdAt ?? ''}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 px-2">
                      <p className="font-medium text-foreground truncate max-w-[140px]" title={p.userEmail ?? undefined}>
                        {p.userName || p.userEmail || p.userId || '—'}
                      </p>
                      {p.userEmail && p.userName && (
                        <p className="text-foreground/50 text-xs truncate max-w-[140px]">{p.userEmail}</p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-foreground/90">{p.bundleName || p.bundleId || '—'}</td>
                    <td className="py-2 px-2 text-right font-medium text-accent">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={p.eventsAddedCount === 0 ? 'text-foreground/50' : 'text-foreground'}>
                        {p.eventsAddedCount}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-foreground/60 text-xs">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
