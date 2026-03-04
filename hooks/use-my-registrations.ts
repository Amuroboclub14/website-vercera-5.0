'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'

/**
 * Returns the set of event IDs the current user has paid for (status paid or completed).
 * Use to show "Registered" on event cards and hide checkout links.
 */
export function useMyRegistrations(): { registeredEventIds: Set<string>; loading: boolean } {
  const { user } = useAuth()
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRegisteredEventIds(new Set())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const fetchRegs = async () => {
      try {
        const regsRef = collection(db, 'registrations')
        const q = query(
          regsRef,
          where('userId', '==', user.uid),
          where('status', 'in', ['paid', 'completed'])
        )
        const snapshot = await getDocs(q)
        if (cancelled) return
        const ids = new Set<string>()
        snapshot.docs.forEach((docSnap) => {
          const eventId = (docSnap.data() as { eventId?: string }).eventId
          if (eventId) ids.add(eventId)
        })
        setRegisteredEventIds(ids)
      } catch {
        if (!cancelled) setRegisteredEventIds(new Set())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRegs()
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  return { registeredEventIds, loading }
}
