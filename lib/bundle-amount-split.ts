/**
 * Split a total amount (in rupees) across N items so the sum is exactly equal to the total.
 * Uses integer paise to avoid floating-point drift (e.g. 299/14 → 21.36 each would sum to 299.04).
 * Returns array of amounts in rupees (rounded to 2 decimal places).
 */
export function splitAmountExactly(totalAmount: number, count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [Math.round(totalAmount * 100) / 100]
  const totalPaise = Math.round(totalAmount * 100)
  const basePaise = Math.floor(totalPaise / count)
  const remainder = totalPaise - basePaise * count
  const amounts: number[] = []
  for (let i = 0; i < count; i++) {
    const paise = basePaise + (i < remainder ? 1 : 0)
    amounts.push(Math.round(paise) / 100)
  }
  return amounts
}
