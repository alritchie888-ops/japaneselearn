import { getKana } from "@/lib/kana/data"
import { isKanaMastered, masteryScore } from "@/lib/store/mastery"
import type { KanaStat } from "@/lib/kana/types"
import { itemRequiredKana, moduleRequiredKana, PRACTICAL_MODULES_BY_ID } from "./data"

/**
 * The dependency engine. A practical lesson is never gated on "finish all of
 * Hiragana" — it unlocks exactly when the kana it actually uses are known well
 * enough to read (~85%+ reliable recognition), so numbers can open long before
 * rarely-used rows, and katakana-based content only appears once that script
 * is learned.
 */

type Stats = Record<string, KanaStat | undefined>

/** ~85–90% confident recognition of a single kana. */
export function isKanaReliable(stat: KanaStat | undefined): boolean {
  if (isKanaMastered(stat)) return true
  return masteryScore(stat) >= 0.8
}

/** Fraction (0–1) of a set of kana that are reliably recognised. */
export function kanaReadiness(kanaIds: string[], stats: Stats): number {
  if (kanaIds.length === 0) return 1
  const ready = kanaIds.filter((id) => isKanaReliable(stats[id])).length
  return ready / kanaIds.length
}

/** Kana in a set that are NOT yet reliable — the ones needing extra support. */
export function unreadyKana(kanaIds: string[], stats: Stats): string[] {
  return kanaIds.filter((id) => !isKanaReliable(stats[id]))
}

export const MODULE_UNLOCK_THRESHOLD = 0.85

export type ModuleLockState = "locked" | "supported" | "open"

export interface ModuleReadiness {
  state: ModuleLockState
  readiness: number
  /** Kana still holding the module back (for the lock explanation). */
  missing: string[]
}

/**
 * A module is:
 *  - "open" when every required kana is reliable,
 *  - "supported" when it's over the unlock threshold but a few kana are still
 *    shaky — those appear with forced romaji/star support rather than blocking,
 *  - "locked" otherwise.
 */
export function moduleReadiness(moduleId: string, stats: Stats): ModuleReadiness {
  const required = moduleRequiredKana(moduleId)
  const readiness = kanaReadiness(required, stats)
  const missing = unreadyKana(required, stats)
  let state: ModuleLockState
  if (missing.length === 0) state = "open"
  else if (readiness >= MODULE_UNLOCK_THRESHOLD) state = "supported"
  else state = "locked"
  return { state, readiness, missing }
}

export function isModuleUnlocked(moduleId: string, stats: Stats): boolean {
  return moduleReadiness(moduleId, stats).state !== "locked"
}

/** Human-readable reason a module is locked, naming the kana to learn next. */
export function lockReason(moduleId: string, stats: Stats): string {
  const { missing } = moduleReadiness(moduleId, stats)
  if (missing.length === 0) return ""
  const chars = missing.slice(0, 4).map((id) => {
    try {
      return getKana(id).char
    } catch {
      return id
    }
  })
  const more = missing.length > chars.length ? ` +${missing.length - chars.length} more` : ""
  return `Learn ${chars.join(" ")}${more} first`
}

/** Whether a specific item's kana are all reliable (else it needs support). */
export function itemNeedsSupport(itemId: string, stats: Stats): boolean {
  return unreadyKana(itemRequiredKana(itemId), stats).length > 0
}

/** Convenience: does this module exist. */
export function moduleExists(moduleId: string): boolean {
  return Boolean(PRACTICAL_MODULES_BY_ID[moduleId])
}
