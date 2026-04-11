/**
 * Events marked excluded are not part of any pack — users register via direct checkout only.
 * Supports legacy Firestore field `excludedFromTechnicalBundle` (same meaning, older name).
 */
export function readExcludedFromAllBundles(data: {
  excludedFromBundles?: boolean
  excludedFromTechnicalBundle?: boolean
}): boolean {
  return Boolean(data.excludedFromBundles ?? data.excludedFromTechnicalBundle)
}
