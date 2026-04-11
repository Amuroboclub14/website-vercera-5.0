/**
 * Events marked excluded are not part of any pack — users register via direct checkout only.
 * Supports legacy Firestore field `excludedFromTechnicalBundle` (same meaning, older name).
 */
export function readExcludedFromAllBundles(
  data: Record<string, unknown> | { excludedFromBundles?: boolean; excludedFromTechnicalBundle?: boolean },
): boolean {
  const b = data as { excludedFromBundles?: unknown; excludedFromTechnicalBundle?: unknown }
  return Boolean(b.excludedFromBundles ?? b.excludedFromTechnicalBundle)
}
