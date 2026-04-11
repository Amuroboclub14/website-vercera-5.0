/** Bundle/pack product types for registration. Admin configures these in the dashboard. */
export type BundleType =
  | 'all_in_one'       // Accommodation + all events (external participants), e.g. Cut on 3099, Rs.2599
  | 'all_events'       // All events pack, e.g. Rs.249
  | 'all_technical'    // All technical except events marked excluded from all bundles
  | 'non_technical'    // Admin-selected non-technical events, e.g. Rs.175
  | 'gaming_all'       // All gaming events, e.g. Rs.99
  | 'single_event'     // Placeholder for single-event product (use event checkout)

export interface BundleRecord {
  id: string
  name: string
  type: BundleType
  /** Price in INR (display & charge). */
  price: number
  /** Original price for strikethrough (e.g. all_in_one: "Cut on 3099, Rs.2599"). */
  originalPrice?: number
  /** For non_technical bundle: event IDs included. For other types may be empty (resolved from events). */
  eventIds: string[]
  description?: string
  /** Display perks with checkmarks on pack cards. */
  perks?: string[]
  /** If true, this bundle is shown as the highlighted/extruded tier (only one should be set). */
  highlight?: boolean
  order?: number
  createdAt?: string
  updatedAt?: string
}
