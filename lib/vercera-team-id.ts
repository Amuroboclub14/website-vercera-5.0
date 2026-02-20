/**
 * Generates a unique Vercera Team ID in the format: VT_<alphanumeric>
 * Format: VT_ followed by 8 alphanumeric characters (no confusing chars).
 * Safe to use on both server (API routes) and client.
 */
export function generateVerceraTeamId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding 0, O, I, 1
  const randomPart = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `VT_${randomPart}`
}

