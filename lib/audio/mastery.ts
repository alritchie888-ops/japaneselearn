import { masteryScore, reps, type KanaStat } from "@/lib/store/mastery"

/**
 * Listening recognition is a SEPARATE skill from visual recognition. It reuses
 * the shared stat map (so persistence is unchanged) but lives under its own key
 * namespace: hearing "ka" → か and seeing か → ka never share a score.
 */

export type Stats = Record<string, KanaStat | undefined>

export function audioKanaKey(kanaId: string): string {
  return `a:${kanaId}`
}

export function audioItemKey(itemId: string): string {
  return `pa:${itemId}`
}

export function listeningMastery(key: string, stats: Stats): number {
  return masteryScore(stats[key])
}

/** Average listening mastery over a set of stat keys, counting only heard ones. */
export function avgListeningMastery(keys: string[], stats: Stats): number {
  const heard = keys.filter((k) => reps(stats[k]) > 0)
  if (heard.length === 0) return 0
  return heard.reduce((a, k) => a + masteryScore(stats[k]), 0) / heard.length
}

export type ListenMode = "practice" | "mastery" | "speed"

export interface AudioHint {
  showRomaji: boolean
  /** 0 = none, 1 = subtle, 2 = prominent. */
  star: number
}

/**
 * On-screen aids for an audio question, fading with listening mastery and the
 * chosen mode. Practice supports the learner; mastery strips romaji; speed
 * shows nothing so the sound must map straight to the script.
 */
export function audioHint(mode: ListenMode, mastery: number, irregular: boolean): AudioHint {
  if (mode === "speed") return { showRomaji: false, star: 0 }
  if (mode === "mastery") {
    return { showRomaji: false, star: irregular && mastery < 0.5 ? 1 : 0 }
  }
  const showRomaji = mastery < 0.6
  let star = 0
  if (irregular) star = mastery < 0.4 ? 2 : mastery < 0.8 ? 1 : 0
  return { showRomaji, star }
}

/** Manual replays allowed after the initial autoplay. -1 = unlimited. */
export function replayLimit(mode: ListenMode): number {
  if (mode === "practice") return -1
  if (mode === "mastery") return 1
  return 0
}
