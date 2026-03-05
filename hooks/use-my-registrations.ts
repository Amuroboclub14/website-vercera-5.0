'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'

type RegData = { eventId?: string }

/**
 * Returns registered event IDs, pack-purchased bundle IDs, total spent (from transactions), and loading.
 * purchasedBundleIds and totalSpent come from /api/me/summary (transactions); registrations from Firestore.
 */
export function useMyRegistrations(): {
  registeredEventIds: Set<string>
  purchasedBundleIds: Set<string>
  totalSpent: number
  loading: boolean
} {
  const { user } = useAuth()
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set())
  const [purchasedBundleIds, setPurchasedBundleIds] = useState<Set<string>>(new Set())
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRegisteredEventIds(new Set())
      setPurchasedBundleIds(new Set())
      setTotalSpent(0)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const fetchAll = async () => {
      try {
        const [regsSnap, summaryRes] = await Promise.all([
          getDocs(
            query(
              collection(db, 'registrations'),
              where('userId', '==', user.uid),
              where('status', 'in', ['paid', 'completed'])
            )
          ),
          user.getIdToken().then((token) =>
            fetch('/api/me/summary', { headers: { Authorization: `Bearer ${token}` } })
          ),
        ])
        if (cancelled) return
        const eventIds = new Set<string>()
        regsSnap.docs.forEach((docSnap) => {
          const d = docSnap.data() as RegData
          if (d.eventId) eventIds.add(d.eventId)
        })
        setRegisteredEventIds(eventIds)

        if (summaryRes.ok) {
          const data = await summaryRes.json()
          setPurchasedBundleIds(new Set(data.purchasedBundleIds ?? []))
          setTotalSpent(Number(data.totalSpent) ?? 0)
        } else {
          setPurchasedBundleIds(new Set())
          setTotalSpent(0)
        }
      } catch {
        if (!cancelled) {
          setRegisteredEventIds(new Set())
          setPurchasedBundleIds(new Set())
          setTotalSpent(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  return { registeredEventIds, purchasedBundleIds, totalSpent, loading }
}
