'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Calendar,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import { useAdminFetch } from '@/hooks/use-admin-fetch'
import { uploadFile } from '@/lib/storage'
import type { EventRecord } from '@/lib/events-types'

interface EventStats {
  count: number
  revenue: number
  attended: number
}

const defaultEvent: Partial<EventRecord> = {
  name: '',
  category: 'technical',
  description: '',
  longDescription: '',
  image: '',
  date: '',
  time: '',
  venue: '',
  registrationFee: 0,
  prizePool: 0,
  maxParticipants: 1,
  rules: [],
  prizes: [{ position: '1st Prize', amount: 0 }],
  isTeamEvent: false,
  teamSizeMin: 1,
  teamSizeMax: 1,
  eventImages: [],
  rulebookUrls: [],
  attachmentUrls: [],
  order: 0,
}

export default function AdminEventsPage() {
  const fetchWithAuth = useAdminFetch()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [eventWise, setEventWise] = useState<Record<string, EventStats>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<EventRecord>>(defaultEvent)
  const [saving, setSaving] = useState(false)
  const [ruleInput, setRuleInput] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [rulebookFiles, setRulebookFiles] = useState<File[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const rulebookInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const loadEvents = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetchWithAuth('/api/admin/events').then((r) => r.json()),
      fetchWithAuth('/api/admin/stats').then((r) => r.json()),
    ])
      .then(([eventsData, statsData]) => {
        if (eventsData.error) throw new Error(eventsData.error)
        setEvents(eventsData.events || [])
        setEventWise(statsData.eventWise || {})
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [fetchWithAuth])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...defaultEvent })
    setRuleInput('')
    setImageFiles([])
    setRulebookFiles([])
    setAttachmentFiles([])
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    setEditingId(id)
    const res = await fetchWithAuth(`/api/admin/events/${id}`)
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      return
    }
    setForm({
      name: data.name,
      category: data.category,
      description: data.description,
      longDescription: data.longDescription,
      image: data.image || '',
      date: data.date || '',
      time: data.time || '',
      venue: data.venue,
      registrationFee: data.registrationFee,
      prizePool: data.prizePool,
      maxParticipants: data.maxParticipants,
      rules: data.rules || [],
      prizes: (data.prizes?.length) ? data.prizes : [{ position: '1st Prize', amount: 0 }],
      isTeamEvent: data.isTeamEvent,
      teamSizeMin: data.teamSizeMin,
      teamSizeMax: data.teamSizeMax,
      eventImages: data.eventImages || (data.image ? [data.image] : []),
      rulebookUrls: data.rulebookUrls || [],
      attachmentUrls: data.attachmentUrls || [],
      order: data.order ?? 0,
    })
    setRuleInput('')
    setImageFiles([])
    setRulebookFiles([])
    setAttachmentFiles([])
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  async function uploadFilesToEvent(eventId: string): Promise<{ eventImages: string[]; rulebookUrls: string[]; attachmentUrls: string[] }> {
    const existingImages = form.eventImages || (form.image ? [form.image] : [])
    const existingRulebook = form.rulebookUrls || []
    const existingAttachments = form.attachmentUrls || []

    const newImageUrls: string[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `events/${eventId}/images/${Date.now()}_${i}.${ext}`
      const url = await uploadFile(file, path)
      newImageUrls.push(url)
    }
    const eventImages = [...existingImages, ...newImageUrls]

    const newRulebookUrls: string[] = []
    for (let i = 0; i < rulebookFiles.length; i++) {
      const file = rulebookFiles[i]
      const ext = file.name.split('.').pop() || 'pdf'
      const path = `events/${eventId}/rulebook/${Date.now()}_${i}.${ext}`
      const url = await uploadFile(file, path)
      newRulebookUrls.push(url)
    }
    const rulebookUrls = [...existingRulebook, ...newRulebookUrls]

    const newAttachmentUrls: string[] = []
    for (let i = 0; i < attachmentFiles.length; i++) {
      const file = attachmentFiles[i]
      const ext = file.name.split('.').pop() || 'bin'
      const path = `events/${eventId}/attachments/${Date.now()}_${i}.${ext}`
      const url = await uploadFile(file, path)
      newAttachmentUrls.push(url)
    }
    const attachmentUrls = [...existingAttachments, ...newAttachmentUrls]

    return { eventImages, rulebookUrls, attachmentUrls }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const rules = form.rules || []
    const payload = {
      ...form,
      rules,
      prizes: form.prizes?.filter((p) => p.position?.trim()) || [],
      eventImages: form.eventImages || [],
      rulebookUrls: form.rulebookUrls || [],
      attachmentUrls: form.attachmentUrls || [],
    }
    try {
      if (editingId) {
        const urls = await uploadFilesToEvent(editingId)
        const res = await fetchWithAuth(`/api/admin/events/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            eventImages: urls.eventImages.length ? urls.eventImages : payload.eventImages,
            rulebookUrls: urls.rulebookUrls.length ? urls.rulebookUrls : payload.rulebookUrls,
            attachmentUrls: urls.attachmentUrls.length ? urls.attachmentUrls : payload.attachmentUrls,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
        loadEvents()
        closeModal()
      } else {
        const res = await fetchWithAuth('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Create failed')
        const newId = data.id
        if (!newId) {
          loadEvents()
          closeModal()
          return
        }
        const urls = await uploadFilesToEvent(newId)
        const hasNewFiles = imageFiles.length > 0 || rulebookFiles.length > 0 || attachmentFiles.length > 0
        if (hasNewFiles) {
          await fetchWithAuth(`/api/admin/events/${newId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventImages: urls.eventImages,
              rulebookUrls: urls.rulebookUrls,
              attachmentUrls: urls.attachmentUrls,
            }),
          })
        }
        loadEvents()
        closeModal()
      }
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete event "${name}"? This will fail if there are any registrations.`)) return
    try {
      const res = await fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      loadEvents()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const updateForm = (key: keyof EventRecord, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addRule = () => {
    const trimmed = ruleInput.trim()
    if (!trimmed) return
    setForm((prev) => ({ ...prev, rules: [...(prev.rules || []), trimmed] }))
    setRuleInput('')
  }

  const removeRule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules?.filter((_, i) => i !== index) || [],
    }))
  }

  const updatePrize = (index: number, field: 'position' | 'amount', value: string | number) => {
    setForm((prev) => {
      const prizes = [...(prev.prizes || [])]
      prizes[index] = { ...prizes[index], [field]: value }
      return { ...prev, prizes }
    })
  }

  const addPrize = () => {
    setForm((prev) => ({
      ...prev,
      prizes: [...(prev.prizes || []), { position: '', amount: 0 }],
    }))
  }

  const removePrize = (index: number) => {
    setForm((prev) => ({
      ...prev,
      prizes: prev.prizes?.filter((_, i) => i !== index) || [],
    }))
  }

  const removeImageUrl = (index: number) => {
    setForm((prev) => {
      const urls = prev.eventImages || []
      const next = urls.filter((_, i) => i !== index)
      return { ...prev, eventImages: next, image: next[0] ?? '' }
    })
  }

  const removeRulebookUrl = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rulebookUrls: prev.rulebookUrls?.filter((_, i) => i !== index) || [],
    }))
  }

  const removeAttachmentUrl = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls?.filter((_, i) => i !== index) || [],
    }))
  }

  const eventImagesList = form.eventImages || (form.image ? [form.image] : [])
  const rulebookUrlsList = form.rulebookUrls || []
  const attachmentUrlsList = form.attachmentUrls || []

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
            Event management
          </h1>
          <p className="text-foreground/60 mt-1 text-sm">
            Create, edit, and delete events. Events are stored in Firestore and shown on the website.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-foreground/60">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-foreground/70">
          <p className="mb-4">No events yet. Add one to get started.</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-full bg-accent text-accent-foreground font-medium"
          >
            Add event
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {events.map((event) => {
            const stats = eventWise[event.id] || { count: 0, revenue: 0, attended: 0 }
            return (
              <div
                key={event.id}
                className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground text-sm sm:text-base">{event.name}</h2>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-0.5">
                    {event.category} · Max {event.maxParticipants} · Fee ₹{event.registrationFee}
                    {(event.rulebookUrls?.length || event.rulebookUrl) ? ' · Rulebook' : ''}
                  </p>
                </div>
                <div className="flex gap-4 sm:gap-6 text-sm flex-wrap">
                  <div>
                    <p className="text-foreground/50 text-xs">Registrations</p>
                    <p className="font-semibold text-foreground">{event.registeredCount ?? stats.count}</p>
                  </div>
                  <div>
                    <p className="text-foreground/50 text-xs">Revenue</p>
                    <p className="font-semibold text-accent">₹{stats.revenue?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-foreground/50 text-xs">Attended</p>
                    <p className="font-semibold text-foreground">{stats.attended}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/admin/registrations?eventId=${event.id}`}
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline min-h-[36px] touch-manipulation"
                  >
                    View registrations <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(event.id)}
                    className="inline-flex items-center gap-1 text-sm text-foreground/80 hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id, event.name)}
                    className="inline-flex items-center gap-1 text-sm text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add/Edit form — scrollable body */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-hidden">
          <div className="flex flex-col w-full max-w-2xl h-[90vh] max-h-[90vh] bg-card border border-border rounded-2xl shadow-xl my-auto overflow-hidden flex-shrink-0">
            <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-card">
              <h2 className="font-semibold text-foreground">
                {editingId ? 'Edit event' : 'Add event'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-scroll overscroll-contain"
              tabIndex={0}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Category</label>
                    <select
                      value={form.category ?? 'technical'}
                      onChange={(e) => updateForm('category', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                      <option value="technical">Technical</option>
                      <option value="non-technical">Non-technical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Short description</label>
                  <input
                    type="text"
                    value={form.description ?? ''}
                    onChange={(e) => updateForm('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Long description</label>
                  <textarea
                    value={form.longDescription ?? ''}
                    onChange={(e) => updateForm('longDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>

                {/* Event images — upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    <ImageIcon className="inline h-4 w-4 mr-1" />
                    Event images
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : []
                      setImageFiles((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm hover:bg-secondary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload images
                  </button>
                  <p className="text-xs text-foreground/50 mt-1">First image is used as the main image. Multiple allowed.</p>
                  {(eventImagesList.length > 0 || imageFiles.length > 0) && (
                    <ul className="mt-2 space-y-1 flex flex-wrap gap-2">
                      {eventImagesList.map((url, i) => (
                        <li key={`url-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="truncate max-w-[180px] text-foreground/70">Image {i + 1}</span>
                          <button type="button" onClick={() => removeImageUrl(i)} className="text-destructive hover:underline">Remove</button>
                        </li>
                      ))}
                      {imageFiles.map((f, i) => (
                        <li key={`file-${i}`} className="text-foreground/70 text-xs">{f.name} (new)</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Date & time selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date ?? ''}
                      onChange={(e) => updateForm('date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Time</label>
                    <input
                      type="time"
                      value={form.time ?? ''}
                      onChange={(e) => updateForm('time', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Venue</label>
                    <input
                      type="text"
                      value={form.venue ?? ''}
                      onChange={(e) => updateForm('venue', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Reg. fee (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.registrationFee ?? 0}
                      onChange={(e) => updateForm('registrationFee', e.target.valueAsNumber || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Prize pool (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.prizePool ?? 0}
                      onChange={(e) => updateForm('prizePool', e.target.valueAsNumber || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Max participants</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxParticipants ?? 1}
                      onChange={(e) => updateForm('maxParticipants', e.target.valueAsNumber || 1)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Order</label>
                    <input
                      type="number"
                      value={form.order ?? 0}
                      onChange={(e) => updateForm('order', e.target.valueAsNumber ?? 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground/80">
                    <input
                      type="checkbox"
                      checked={form.isTeamEvent ?? false}
                      onChange={(e) => updateForm('isTeamEvent', e.target.checked)}
                      className="rounded border-border"
                    />
                    Team event
                  </label>
                  {(form.isTeamEvent ?? false) && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground/70">Min</span>
                        <input
                          type="number"
                          min={1}
                          value={form.teamSizeMin ?? 1}
                          onChange={(e) => updateForm('teamSizeMin', e.target.valueAsNumber || 1)}
                          className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground/70">Max</span>
                        <input
                          type="number"
                          min={1}
                          value={form.teamSizeMax ?? 1}
                          onChange={(e) => updateForm('teamSizeMax', e.target.valueAsNumber || 1)}
                          className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Rulebook — upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Rulebook & docs (optional)
                  </label>
                  <input
                    ref={rulebookInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : []
                      setRulebookFiles((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => rulebookInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm hover:bg-secondary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload rulebook / PDFs
                  </button>
                  {(rulebookUrlsList.length > 0 || rulebookFiles.length > 0) && (
                    <ul className="mt-2 space-y-1 flex flex-wrap gap-2">
                      {rulebookUrlsList.map((_, i) => (
                        <li key={`rb-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="text-foreground/70">Rulebook {i + 1}</span>
                          <button type="button" onClick={() => removeRulebookUrl(i)} className="text-destructive hover:underline">Remove</button>
                        </li>
                      ))}
                      {rulebookFiles.map((f, i) => (
                        <li key={`rbf-${i}`} className="text-foreground/70 text-xs">{f.name} (new)</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Other attachments */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Other attachments (optional)</label>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : []
                      setAttachmentFiles((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm hover:bg-secondary"
                  >
                    <Upload className="h-4 w-4" />
                    Upload files
                  </button>
                  {(attachmentUrlsList.length > 0 || attachmentFiles.length > 0) && (
                    <ul className="mt-2 space-y-1 flex flex-wrap gap-2">
                      {attachmentUrlsList.map((_, i) => (
                        <li key={`att-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="text-foreground/70">Attachment {i + 1}</span>
                          <button type="button" onClick={() => removeAttachmentUrl(i)} className="text-destructive hover:underline">Remove</button>
                        </li>
                      ))}
                      {attachmentFiles.map((f, i) => (
                        <li key={`attf-${i}`} className="text-foreground/70 text-xs">{f.name} (new)</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Rules — one input + Add */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Rules</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ruleInput}
                      onChange={(e) => setRuleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                      placeholder="Add a rule..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                    />
                    <button
                      type="button"
                      onClick={addRule}
                      className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {(form.rules || []).map((rule, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                        <span className="text-foreground/90">{rule}</span>
                        <button type="button" onClick={() => removeRule(i)} className="text-destructive p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prizes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground/80">Prizes</label>
                    <button type="button" onClick={addPrize} className="text-xs text-accent hover:underline">
                      + Add prize
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(form.prizes || []).map((prize, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={prize.position}
                          onChange={(e) => updatePrize(i, 'position', e.target.value)}
                          placeholder="1st Prize"
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                        />
                        <input
                          type="number"
                          min={0}
                          value={prize.amount}
                          onChange={(e) => updatePrize(i, 'amount', e.target.valueAsNumber || 0)}
                          placeholder="Amount"
                          className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                        />
                        <button type="button" onClick={() => removePrize(i)} className="text-destructive p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-full bg-accent text-accent-foreground font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : editingId ? 'Update event' : 'Create event'}
                  </button>
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-full border border-border">
                    Cancel
                  </button>
                </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
