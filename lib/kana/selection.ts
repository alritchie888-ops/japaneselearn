import type { KanaStat } from "@/lib/store/mastery"
import { selectionWeight } from "@/lib/store/mastery"

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface BalancedSampleOptions {
  /** Base selection weight for an id — higher means it should appear more. */
  weightOf: (id: string) => number
  /** How many picks to produce. May exceed the pool size, forcing repeats. */
  n: number
  /**
   * "coverage" (default) strongly prefers not-yet-seen items, so a normal test
   * of size >= pool usually shows every item before any repeat. "targeted"
   * relaxes that so weak items can come back around sooner.
   */
  bias?: "coverage" | "targeted"
}

/**
 * Sample `n` ids from `pool` WITH repetition allowed, but biased toward broad
 * coverage: each pick is penalised for how many times it has already appeared
 * and for appearing too recently. This keeps small pools feeling balanced —
 * the learner sees the whole range before anything repeats — without going
 * fully deterministic, and still lets weakness weighting and (in "targeted"
 * mode) useful repetition come through.
 */
export function balancedSample(pool: readonly string[], opts: BalancedSampleOptions): string[] {
  const ids = [...new Set(pool)]
  if (ids.length === 0) return []
  const { weightOf, n } = opts
  const bias = opts.bias ?? "coverage"
  // How hard an already-used item is suppressed. High => exhaust the pool
  // before repeating (breadth); low => let weak items return sooner.
  const coverageExp = bias === "coverage" ? 3.5 : 1.1
  const used = new Map<string, number>()
  const lastPos = new Map<string, number>()
  const out: string[] = []

  for (let i = 0; i < n; i++) {
    const weights = ids.map((id) => {
      const base = Math.max(0.05, weightOf(id))
      const count = used.get(id) ?? 0
      const coverage = 1 / Math.pow(1 + count, coverageExp)
      const prev = lastPos.get(id)
      const since = prev === undefined ? Number.POSITIVE_INFINITY : i - prev
      // Space repeats apart: hard block on back-to-back, softer within two.
      const spacing = since === 1 ? 0.1 : since === 2 ? 0.45 : 1
      return base * coverage * spacing
    })
    let total = weights.reduce((a, b) => a + b, 0)
    if (total <= 0) total = 1
    let r = Math.random() * total
    let idx = 0
    for (let j = 0; j < ids.length; j++) {
      r -= weights[j]
      if (r <= 0) {
        idx = j
        break
      }
    }
    const chosen = ids[idx]
    out.push(chosen)
    used.set(chosen, (used.get(chosen) ?? 0) + 1)
    lastPos.set(chosen, i)
  }
  return out
}

/** Sample `n` unique ids from `pool`, weighted by the mastery-based selection weight. */
export function weightedSample(
  pool: string[],
  stats: Record<string, KanaStat>,
  n: number,
  now = Date.now(),
): string[] {
  const remaining = [...new Set(pool)]
  const chosen: string[] = []
  const count = Math.min(n, remaining.length)
  for (let k = 0; k < count; k++) {
    const weights = remaining.map((id) => selectionWeight(stats[id], now))
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let idx = 0
    for (let i = 0; i < remaining.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        idx = i
        break
      }
    }
    chosen.push(remaining[idx])
    remaining.splice(idx, 1)
  }
  return chosen
}
