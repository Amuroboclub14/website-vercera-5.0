import type { Firestore } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'
import { dedupeRegistrationsByUserEventTeam } from '@/lib/dedupe-registrations'

const ALLOWED_LEVELS = ['owner', 'super_admin', 'event_admin'] as const

/** Firestore batch reads are capped per request; keep chunks small. */
const PARTICIPANT_FETCH_CHUNK = 25

async function loadParticipantMap(
  db: Firestore,
  userIds: string[]
): Promise<Record<string, { fullName: string; email?: string; phone?: string }>> {
  const unique = [...new Set(userIds)].filter(Boolean)
  const out: Record<string, { fullName: string; email?: string; phone?: string }> = {}
  for (let i = 0; i < unique.length; i += PARTICIPANT_FETCH_CHUNK) {
    const chunk = unique.slice(i, i + PARTICIPANT_FETCH_CHUNK)
    const refs = chunk.map((uid) => db.collection('vercera_5_participants').doc(uid))
    const snaps = await db.getAll(...refs)
    snaps.forEach((snap, j) => {
      if (!snap.exists) return
      const uid = chunk[j]
      const d = snap.data()
      out[uid] = {
        fullName: (d?.fullName as string) || '—',
        email: d?.email as string | undefined,
        phone: d?.whatsappNumber as string | undefined,
      }
    })
  }
  return out
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const db = getVerceraFirestore()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    /**
     * When viewing all events, optional cap protects huge datasets.
     * Filtered views (event/status) return every matching row so nothing is hidden.
     */
    const maxRowsAllEvents = Math.min(Number(searchParams.get('limit')) || 25_000, 50_000)

    const snapshot = await db.collection('registrations').get()

    let registrations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<
      Record<string, unknown> & {
        id: string
        userId?: string
        verceraId?: string
        eventId?: string
        status?: string
        createdAt?: string
        verceraTeamId?: string
        teamId?: string
      }
    >

    registrations.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    if (eventId) registrations = registrations.filter((r) => r.eventId === eventId)
    if (status) registrations = registrations.filter((r) => r.status === status)

    const filtered = Boolean(eventId || status)
    if (!filtered && registrations.length > maxRowsAllEvents) {
      registrations = registrations.slice(0, maxRowsAllEvents)
    }

    const userIds = [...new Set(registrations.map((r) => r.userId).filter(Boolean))] as string[]
    const participantMap = await loadParticipantMap(db, userIds)

    const enriched = dedupeRegistrationsByUserEventTeam(
      registrations
        .filter((r) => Boolean(r.userId))
        .map((r) => {
          const p = r.userId ? participantMap[r.userId] : undefined
          const missingProfile = Boolean(r.userId && !p)
          return {
            ...r,
            participantName: p?.fullName ?? (missingProfile ? '(profile missing in Firestore)' : '—'),
            participantEmail: p?.email ?? null,
            participantPhone: p?.phone ?? null,
            profileMissing: missingProfile,
          }
        })
    ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    return NextResponse.json({ registrations: enriched })
  } catch (err) {
    console.error('Admin registrations list error:', err)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
