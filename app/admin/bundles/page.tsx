'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Package, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import type { BundleRecord, BundleType } from '@/lib/bundles-types'
import type { EventRecord } from '@/lib/events-types'

const BUNDLE_TYPES: { value: BundleType; label: string }[] = [
  { value: 'all_in_one', label: 'All-in-one (accommodation + all events, external)' },
  { value: 'all_events', label: 'All events pack' },
  { value: 'all_technical', label: 'All technical (excl. Sumo Bots, Robowars)' },
  { value: 'non_technical', label: 'Non-technical bundle (select events)' },
  { value: 'gaming_all', label: 'Gaming (all) – select events' },
]

export default function AdminBundlesPage() {
  const fetchWithAuth = useAdminFetch()
  const [bundles, setBundles] = useState<BundleRecord[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<BundleRecord>>({
    name: '',
    type: 'all_events',
    price: 0,
    originalPrice: undefined,
    eventIds: [],
    description: '',
    perks: [],
    highlight: false,
    order: 0,
  })
  const [newPerk, setNewPerk] = useState('')

  const loadBundles = useCallback(() => {
    setLoading(true)
    fetchWithAuth('/api/admin/bundles')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setBundles(data.bundles || [])
      })
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [fetchWithAuth])

  const loadEvents = useCallback(() => {
    fetchWithAuth('/api/admin/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return
        setEvents(data.events || [])
      })
      .catch(() => {})
  }, [fetchWithAuth])

  useEffect(() => {
    loadBundles()
    loadEvents()
  }, [loadBundles, loadEvents])

  useEffect(() => {
    if (modalOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [modalOpen])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      type: 'all_events',
      price: 0,
      originalPrice: undefined,
      eventIds: [],
      description: '',
      perks: [],
      highlight: false,
      order: bundles.length,
    })
    setNewPerk('')
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    setEditingId(id)
    const res = await fetchWithAuth(`/api/admin/bundles/${id}`)
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      return
    }
    setForm({
      name: data.name,
      type: data.type ?? 'all_events',
      price: data.price ?? 0,
      originalPrice: data.originalPrice,
      eventIds: data.eventIds ?? [],
      description: data.description ?? '',
      perks: data.perks ?? [],
      highlight: Boolean(data.highlight),
      order: data.order ?? 0,
    })
    setNewPerk('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  const updateForm = (key: keyof BundleRecord, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      type: form.type,
      price: Number(form.price) ?? 0,
      originalPrice: form.originalPrice != null ? Number(form.originalPrice) : undefined,
      eventIds: form.eventIds ?? [],
      description: form.description ?? '',
      perks: form.perks ?? [],
      highlight: Boolean(form.highlight),
      order: form.order ?? 0,
    }
    try {
      if (editingId) {
        const res = await fetchWithAuth(`/api/admin/bundles/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
      } else {
        const res = await fetchWithAuth('/api/admin/bundles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }
      loadBundles()
      closeModal()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete bundle "${name}"?`)) return
    try {
      const res = await fetchWithAuth(`/api/admin/bundles/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      loadBundles()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const needsEventSelection = form.type === 'non_technical' || form.type === 'gaming_all'
  const toggleEventId = (eventId: string) => {
    const ids = form.eventIds ?? []
    if (ids.includes(eventId)) {
      updateForm('eventIds', ids.filter((id) => id !== eventId))
    } else {
      updateForm('eventIds', [...ids, eventId])
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundles & Packs
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Add bundle
        </button>
      </div>

      <p className="text-sm text-foreground/70">
        Configure registration bundles (all-in-one, all events, technical, non-technical, gaming). For &quot;Non-technical&quot; and &quot;Gaming&quot; select which events are included. Events marked &quot;Excluded from technical bundle&quot; are omitted from the All technical bundle.
      </p>

      {loading ? (
        <p className="text-foreground/60">Loading…</p>
      ) : bundles.length === 0 ? (
        <p className="text-foreground/60">No bundles yet. Add one to get started.</p>
      ) : (
        <div className="grid gap-4">
          {bundles.map((b) => (
            <div
              key={b.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-foreground">{b.name}</p>
                <p className="text-sm text-foreground/70">
                  {BUNDLE_TYPES.find((t) => t.value === b.type)?.label ?? b.type} · ₹{b.price}
                  {b.originalPrice != null && (
                    <span className="line-through ml-1 text-foreground/50">₹{b.originalPrice}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(b.id)}
                  className="inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id, b.name)}
                  className="inline-flex items-center gap-1 text-sm text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 overflow-hidden"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col w-full max-w-lg h-[90vh] max-h-[90vh] my-auto bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex-shrink-0">
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-foreground">{editingId ? 'Edit bundle' : 'Add bundle'}</h2>
                <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-secondary text-foreground" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                className="scroll-area-touch flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain focus:outline-none"
                tabIndex={0}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name ?? ''}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Type</label>
                <select
                  value={form.type ?? 'all_events'}
                  onChange={(e) => updateForm('type', e.target.value as BundleType)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                >
                  {BUNDLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price ?? 0}
                    onChange={(e) => updateForm('price', e.target.valueAsNumber || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Original price (₹) – optional</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.originalPrice ?? ''}
                    onChange={(e) => updateForm('originalPrice', e.target.value === '' ? undefined : e.target.valueAsNumber)}
                    placeholder="e.g. 3099"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              </div>
              {needsEventSelection && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Events included</label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                    {events.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.eventIds ?? []).includes(ev.id)}
                          onChange={() => toggleEventId(ev.id)}
                          className="rounded border-border"
                        />
                        <span>{ev.name}</span>
                        <span className="text-foreground/50">({ev.category})</span>
                      </label>
                    ))}
                    {events.length === 0 && <p className="text-foreground/50 text-sm">No events. Create events first.</p>}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Description (optional)</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Perks (shown with checkmarks on pack cards)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPerk}
                    onChange={(e) => setNewPerk(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const t = newPerk.trim()
                        if (t) {
                          updateForm('perks', [...(form.perks ?? []), t])
                          setNewPerk('')
                        }
                      }
                    }}
                    placeholder="e.g. Access to all technical events"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = newPerk.trim()
                      if (t) {
                        updateForm('perks', [...(form.perks ?? []), t])
                        setNewPerk('')
                      }
                    }}
                    className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-secondary text-sm"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1 max-h-32 overflow-y-auto border border-border rounded-lg p-2">
                  {(form.perks ?? []).map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2 text-sm text-foreground">
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => updateForm('perks', (form.perks ?? []).filter((_, i) => i !== idx))}
                        className="text-destructive hover:bg-destructive/10 rounded px-1.5 py-0.5"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                  {(form.perks ?? []).length === 0 && (
                    <li className="text-foreground/50 text-sm">No perks yet. Add lines to show with checkmarks.</li>
                  )}
                </ul>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.highlight)}
                    onChange={(e) => updateForm('highlight', e.target.checked)}
                    className="rounded border-border"
                  />
                  Highlight this bundle (extruded / featured tier — only one bundle can be highlighted)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
