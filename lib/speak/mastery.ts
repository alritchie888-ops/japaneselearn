import { masteryScore, reps, type KanaStat } from "@/lib/store/mastery"

/**
 * Spoken production is its own skill, tracked apart from visual and listening
 * recognition. It reuses the shared stat map but under a dedicated key space so
 * seeing か→ka, hearing ka→か, and SAYING か never share a score. Pronunciation
 * confidence is tracked separately again (see the store's `pron` map) because a
 * correct reading said unclearly must not look like a wrong reading.
 */

export type Stats = Record<string, KanaStat | undefined>

export function speakKanaKey(kanaId: string): string {
  return `s:${kanaId}`
}

export function speakItemKey(itemId: string): string {
  return `ps:${itemId}`
}

export function speakingMastery(key: string, stats: Stats): number {
  return masteryScore(stats[key])
}

/** Average speaking mastery over a set of keys, counting only attempted ones. */
export function avgSpeakingMastery(keys: string[], stats: Stats): number {
  const tried = keys.filter((k) => reps(stats[k]) > 0)
  if (tried.length === 0) return 0
  return tried.reduce((a, k) => a + masteryScore(stats[k]), 0) / tried.length
}

export type SpeakMode = "practice" | "mastery" | "speed"

export interface SpeakHint {
  /** Show the full kana reading under the prompt. */
  showReading: boolean
  /** Show the romaji reading. */
  showRomaji: boolean
  /** 0 = none, 1 = subtle, 2 = prominent gold star for irregular forms. */
  star: number
}

/**
 * Progressive on-screen support, fading as speaking mastery grows and stripped
 * further by tougher modes. Practice walks the learner up the stages (reading →
 * romaji → nothing); mastery shows almost nothing; speed shows nothing at all.
 */
export function speakHint(mode: SpeakMode, mastery: number, irregular: boolean): SpeakHint {
  if (mode === "speed") return { showReading: false, showRomaji: false, star: 0 }
  if (mode === "mastery") {
    return { showReading: false, showRomaji: false, star: irregular && mastery < 0.5 ? 1 : 0 }
  }
  // practice — Stage 1→3 support that recedes with mastery
  const showReading = mastery < 0.3
  const showRomaji = mastery < 0.6
  let star = 0
  if (irregular) star = mastery < 0.4 ? 2 : mastery < 0.8 ? 1 : 0
  return { showReading, showRomaji, star }
}

/** Replays of the correct pronunciation allowed before answering. -1 = unlimited. */
export function replayLimit(mode: SpeakMode): number {
  if (mode === "practice") return -1
  if (mode === "mastery") return 0
  return 0
}

/**
 * Mastery credit for a spoken answer. First-try correct earns full credit;
 * later attempts and any use of the pronunciation replay earn less. Technical
 * recognition failures are handled upstream and never reach here as "wrong".
 */
export function speakCredit(attempts: number, usedReplay: boolean): boolean {
  if (attempts > 2) return false
  if (usedReplay) return false
  return true
}
