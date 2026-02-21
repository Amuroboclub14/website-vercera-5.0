'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import { useAdmin } from '@/hooks/use-admin'

interface Participant {
  id: string
  verceraId?: string
  fullName?: string
  email?: string
}

interface AdminRole {
  userId: string
  role: 'super_admin' | 'event_admin' | 'owner'
  email?: string | null
  fullName?: string | null
  addedAt?: string | null
}

type RoleOption = 'owner' | 'super_admin' | 'event_admin' | ''

export default function AdminManageAdminsPage() {
  const { user } = useAuth()
  const fetchWithAuth = useAdminFetch()
  const { level, bootstrapOwnerUid } = useAdmin()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [admins, setAdmins] = useState<AdminRole[]>([])
  const [ownerUids, setOwnerUids] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const isOwner = level === 'owner'
  const isBootstrapOwner = user?.uid === bootstrapOwnerUid
  // Hide current user and all owners from the list
  const participantsFiltered = participants.filter(
    (p) => p.id !== user?.uid && !ownerUids.includes(p.id)
  )

  const loadAdmins = useCallback(() => {
    fetchWithAuth('/api/admin/admins')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setAdmins(data.admins || [])
        setOwnerUids(Array.isArray(data.ownerUids) ? data.ownerUids : [])
      })
      .catch(() => {
        setAdmins([])
        setOwnerUids([])
      })
  }, [fetchWithAuth])

  const loadParticipants = useCallback(() => {
    const params = new URLSearchParams({ limit: '500' })
    if (search.trim()) params.set('search', search.trim())
    setLoading(true)
    fetchWithAuth(`/api/admin/participants?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setParticipants(data.participants || [])
      })
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false))
  }, [fetchWithAuth, search])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  useEffect(() => {
    const t = setTimeout(loadParticipants, 300)
    return () => clearTimeout(t)
  }, [loadParticipants])

  const roleByUserId = Object.fromEntries(admins.map((a) => [a.userId, a.role]))

  const setRole = async (userId: string, role: RoleOption) => {
    const value = role === '' ? null : role
    setUpdating(userId)
    try {
      const res = await fetchWithAuth('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      loadAdmins()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" />
          Manage admins
        </h1>
        <p className="text-foreground/60 mt-1">
          Assign Owner, Super Admin, or Event Admin. Only the primary owner (set in env) can assign new Owners.
          Event Admins can only access Ticket Scan; Super Admins have full access except managing Owners.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
        <input
          type="text"
          placeholder="Search by name, email, or Vercera ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-foreground/60">Loading participants...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Participant</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Vercera ID</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground/80">Role</th>
                </tr>
              </thead>
              <tbody>
                {participantsFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-foreground/50">
                      {participants.length === 0
                        ? 'No participants match your search.'
                        : 'No other participants to show (you are excluded from this list).'}
                    </td>
                  </tr>
                ) : (
                  participantsFiltered.map((p) => {
                    const current = roleByUserId[p.id]
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground font-medium">
                          {p.fullName || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-foreground/80">
                          {p.verceraId || '—'}
                        </td>
                        <td className="py-3 px-4 text-foreground/70">{p.email || '—'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={current ?? ''}
                            disabled={!!updating}
                            onChange={(e) =>
                              setRole(p.id, (e.target.value || '') as RoleOption)
                            }
                            className="rounded-lg border border-border bg-background text-foreground text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                          >
                            <option value="">None</option>
                            <option value="event_admin">Event Admin</option>
                            {isOwner && <option value="super_admin">Super Admin</option>}
                            {isBootstrapOwner && <option value="owner">Owner</option>}
                          </select>
                          {updating === p.id && (
                            <span className="ml-2 text-foreground/50 text-xs">Updating…</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
