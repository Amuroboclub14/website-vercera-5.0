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
  /** If true, shown as flagship event with distinct UI and on top of lists. */
  flagship?: boolean
  /** Optional sponsor block for flagship event presentation. */
  flagshipSponsor?: {
    name: string
    logoUrl?: string
    websiteUrl?: string
    categories?: string[]
  }
  /** Optional special category winner block (separate from 1st/2nd/3rd prizes). */
  specialCategoryAward?: {
    name: string
    description: string
    logoUrl?: string
  }
  /** Exclude from all packs/bundles (direct registration only). Legacy docs may use excludedFromTechnicalBundle. */
  excludedFromBundles?: boolean
  /** Include in non-technical bundle (admin chooses which events). */
  includedInNonTechnicalBundle?: boolean
  createdAt?: string
  updatedAt?: string
}
