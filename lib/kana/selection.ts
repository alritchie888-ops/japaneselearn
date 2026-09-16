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
