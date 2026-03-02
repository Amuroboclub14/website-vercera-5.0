/** Shared event type for Firestore and API. */
export interface EventRecord {
  id: string
  name: string
  category: 'technical' | 'non-technical'
  description: string
  longDescription: string
  /** Primary image URL (first of eventImages, or legacy single image). */
  image: string
  date: string
  time: string
  venue: string
  registrationFee: number
  prizePool: number
  maxParticipants: number
  registeredCount?: number // computed when serving, not stored in Firestore
  rules: string[]
  prizes: { position: string; amount: number }[]
  isTeamEvent?: boolean
  teamSizeMin?: number
  teamSizeMax?: number
  /** Optional rulebook URL – legacy single URL; prefer rulebookUrls. */
  rulebookUrl?: string
  /** Image URLs from Firebase Storage (event images). */
  eventImages?: string[]
  /** Rulebook / PDF file URLs from Firebase Storage. */
  rulebookUrls?: string[]
  /** Other attachment URLs (docs, etc.) from Firebase Storage. */
  attachmentUrls?: string[]
  /** Display order (lower first). */
  order?: number
  /** Exclude from "all technical" bundle (e.g. Sumo Bots, Robowars sold separately). */
  excludedFromTechnicalBundle?: boolean
  /** Include in non-technical bundle (admin chooses which events). */
  includedInNonTechnicalBundle?: boolean
  createdAt?: string
  updatedAt?: string
}
