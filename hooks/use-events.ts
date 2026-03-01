'use client'

import { useState, useEffect } from 'react'
import type { EventRecord } from '@/lib/events-types'

export function useEvents() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [eventsVisible, setEventsVisible] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setEvents(data.events || [])
        setEventsVisible(data.eventsVisible === true)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load events')
        setEvents([])
        setEventsVisible(false)
      })
      .finally(() => setLoading(false))
  }, [])

  /** True when we should show "Revealing soon" (visibility off or no events). */
  const showComingSoon = !eventsVisible || events.length === 0
  return { events, loading, error, eventsVisible, showComingSoon }
}

export function useEvent(id: string | null) {
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setEvent(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/events/${id}`)
      .then((res) => {
        if (res.status === 404) return null
        return res.json()
      })
      .then((data) => {
        if (data === null) {
          setEvent(null)
          return
        }
        if (data.error) throw new Error(data.error)
        setEvent(data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load event')
        setEvent(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  return { event, loading, error }
}
