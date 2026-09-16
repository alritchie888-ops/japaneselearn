import { masteryScore, reps, recentAccuracy } from "@/lib/store/mastery"
import type { KanaStat } from "@/lib/kana/types"
import type { PracticalItem, RomajiMode } from "./types"
import { itemNeedsSupport } from "./dependency"

/**
 * Practical items reuse the shared stat map (keyed by id) so persistence is
 * unchanged. Each item tracks recognition and reverse recall as SEPARATE
 * skills — knowing the kana, the reading, the irregular form, and each
 * direction are deliberately distinct.
 */
export type PracticalDirection = "forward" | "reverse"

export function itemStatKey(itemId: string, direction: PracticalDirection): string {
  return direction === "reverse" ? `p:${itemId}:rev` : `p:${itemId}`
}

type Stats = Record<string, KanaStat | undefined>

/** Combined 0–1 mastery of an item across both directions. */
export function itemMastery(itemId: string, stats: Stats): number {
  const f = masteryScore(stats[itemStatKey(itemId, "forward")])
  const r = masteryScore(stats[itemStatKey(itemId, "reverse")])
  return (f + r) / 2
}

export function itemReps(itemId: string, stats: Stats): number {
  return (
    reps(stats[itemStatKey(itemId, "forward")]) +
    reps(stats[itemStatKey(itemId, "reverse")])
  )
}

export function itemAccuracy(itemId: string, stats: Stats): number {
  const fk = itemStatKey(itemId, "forward")
  const rk = itemStatKey(itemId, "reverse")
  const fr = reps(stats[fk])
  const rr = reps(stats[rk])
  if (fr + rr === 0) return 1
  return (recentAccuracy(stats[fk]) * fr + recentAccuracy(stats[rk]) * rr) / (fr + rr)
}

export function isItemMastered(itemId: string, stats: Stats): boolean {
  return itemMastery(itemId, stats) >= 0.85 && itemReps(itemId, stats) >= 4
}

/** Support level a card should render with. */
export type Support = "full" | "reduced" | "auto"

export interface Hint {
  showRomaji: boolean
  /** 0 = no star, 1 = subtle, 2 = prominent. */
  star: number
}

/**
 * Decide the on-screen aids for an item given the learner's romaji setting,
 * how well they know the item, and whether the lesson stage forces support.
 * Romaji fades out as mastery grows (in "fade" mode); the gold star for an
 * irregular reading shrinks and disappears the same way.
 */
export function hintFor(
  item: PracticalItem,
  opts: { mode: RomajiMode; mastery: number; support: Support; needsSupport: boolean },
): Hint {
  const { mode, mastery, support, needsSupport } = opts

  // A shaky prerequisite kana always forces the strongest support.
  const effective: Support = needsSupport ? "full" : support

  let showRomaji: boolean
  if (mode === "on") showRomaji = true
  else if (mode === "off") showRomaji = effective === "full"
  else {
    // fade
    if (effective === "full") showRomaji = true
    else if (effective === "reduced") showRomaji = mastery < 0.45
    else showRomaji = mastery < 0.6
  }

  let star = 0
  if (item.irregular) {
    if (effective === "full") star = 2
    else if (effective === "reduced") star = mastery < 0.6 ? 2 : 1
    else star = mastery < 0.4 ? 2 : mastery < 0.8 ? 1 : 0
  }

  return { showRomaji, star }
}

export { itemNeedsSupport }
