/**
 * Collapse accidental duplicate registration docs (same user + event + team identity).
 * Historical duplicates were created when two payment callbacks passed the non-atomic
 * idempotency check before either write completed.
 */
export function dedupeRegistrationsByUserEventTeam<
  T extends {
    id: string
    userId?: string
    eventId?: string
    teamId?: string
    verceraTeamId?: string
    createdAt?: string
  },
>(rows: T[]): T[] {
  const map = new Map<string, T>()
  for (const r of rows) {
    const uid = r.userId ?? ''
    const eid = r.eventId ?? ''
    const teamKey = [r.verceraTeamId, r.teamId].filter(Boolean).join(':') || 'solo'
    const key = `${uid}|${eid}|${teamKey}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, r)
      continue
    }
    const a = r.createdAt ?? ''
    const b = existing.createdAt ?? ''
    if (a && b) {
      if (a < b) map.set(key, r)
      else if (a === b && r.id < existing.id) map.set(key, r)
    } else if (a && !b) {
      map.set(key, r)
    } else if (!a && !b && r.id < existing.id) {
      map.set(key, r)
    }
  }
  return Array.from(map.values())
}
