'use client'

import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Stats {
  totalRevenue: number
  eventWise: Record<string, { count: number; revenue: number; attended: number }>
  recentRegistrations: Array<{
    id: string
    eventName?: string
    amount?: number
    status?: string
    razorpayOrderId?: string
    createdAt?: string
  }>
}

const CHART_COLORS = ['#C1E734', '#9BC420', '#7AA319', '#5C7D12', '#3D540C']

export default function AdminTransactionsPage() {
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
        <p className="text-foreground/70">Loading...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-destructive">Failed to load transaction data.</p>
      </div>
    )
  }

  const paidRegs = stats.recentRegistrations.filter(
    (r) => r.status === 'paid' || r.status === 'completed'
  )

  const eventChartData = Object.entries(stats.eventWise).map(([name, d]) => ({
    name: name.length > 12 ? name.slice(0, 12) + '…' : name,
    revenue: d.revenue,
    fullName: name,
  }))

  const pieData = Object.entries(stats.eventWise).map(([name, d], i) => ({
    name: name.length > 15 ? name.slice(0, 15) + '…' : name,
    value: d.revenue,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
          Transactions
        </h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Revenue breakdown and payment list
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-semibold text-foreground text-sm sm:text-base mb-1 sm:mb-2">Total revenue</h2>
          <p className="text-xl sm:text-3xl font-bold text-accent truncate">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-semibold text-foreground text-sm sm:text-base mb-1 sm:mb-2">Paid</h2>
          <p className="text-xl sm:text-3xl font-bold text-foreground">{paidRegs.length}</p>
        </div>
      </div>

      {eventChartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 sm:p-6">
          <h2 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">
            Revenue by event (bar)
          </h2>
          <div className="h-56 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventChartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName}
                />
                <Bar dataKey="revenue" fill="#C1E734" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {pieData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 sm:p-6">
          <h2 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">
            Revenue share (pie)
          </h2>
          <div className="h-56 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden -mx-4 sm:mx-0">
        <h2 className="font-semibold text-foreground text-sm sm:text-base p-3 sm:p-4 border-b border-border">
          Recent paid transactions
        </h2>
        <div className="overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-96">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2 px-4 font-medium text-foreground/80">
                  Event
                </th>
                <th className="text-right py-2 px-4 font-medium text-foreground/80">
                  Amount
                </th>
                <th className="text-left py-2 px-4 font-medium text-foreground/80">
                  Order ID
                </th>
                <th className="text-left py-2 px-4 font-medium text-foreground/80">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {paidRegs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-foreground/50">
                    No paid transactions yet.
                  </td>
                </tr>
              ) : (
                paidRegs.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-secondary/20"
                  >
                    <td className="py-2 px-4 text-foreground">
                      {r.eventName || r.eventId || '—'}
                    </td>
                    <td className="py-2 px-4 text-right font-medium text-accent">
                      ₹{Number(r.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-4 text-foreground/60 font-mono text-xs">
                      {r.razorpayOrderId || '—'}
                    </td>
                    <td className="py-2 px-4 text-foreground/50 text-xs">
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
    </div>
  )
}
