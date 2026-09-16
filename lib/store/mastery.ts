import { UNITS, UNITS_BY_ID } from "@/lib/kana/data"
import { unitIndex, unitTargetKana } from "@/lib/kana/curriculum"

export interface KanaStat {
  correct: number
  incorrect: number
  /** Current consecutive-correct streak. */
  streak: number
  lastReviewed: number
  /** Spaced-review interval in days. */
  interval: number
  /** Next-due timestamp (ms). */
  dueAt: number
  /** Recent results, 1 = correct, 0 = wrong (most recent last, capped). */
  history: number[]
}

export const HISTORY_CAP = 12
const DAY = 24 * 60 * 60 * 1000

export function emptyStat(): KanaStat {
  return {
    correct: 0,
    incorrect: 0,
    streak: 0,
    lastReviewed: 0,
    interval: 0,
    dueAt: 0,
    history: [],
  }
}

export function reps(stat?: KanaStat): number {
  if (!stat) return 0
  return stat.correct + stat.incorrect
}

export function recentAccuracy(stat?: KanaStat): number {
  if (!stat || stat.history.length === 0) return 0
  const sum = stat.history.reduce((a, b) => a + b, 0)
  return sum / stat.history.length
}

/** 0..1 mastery, scaled by how much evidence we have. */
export function masteryScore(stat?: KanaStat): number {
  if (!stat || reps(stat) === 0) return 0
  const confidence = Math.min(1, reps(stat) / 5)
  return recentAccuracy(stat) * confidence
}

export function masteryLevel(stat?: KanaStat): 0 | 1 | 2 | 3 | 4 {
  const s = masteryScore(stat)
  if (s >= 0.9) return 4
  if (s >= 0.7) return 3
  if (s >= 0.45) return 2
  if (s > 0) return 1
  return 0
}

export function isKanaMastered(stat?: KanaStat): boolean {
  return !!stat && reps(stat) >= 3 && recentAccuracy(stat) >= 0.9
}

/** Apply a review result to a stat, returning a new stat (immutable). */
export function applyResult(prev: KanaStat | undefined, correct: boolean, now = Date.now()): KanaStat {
  const stat = prev ? { ...prev, history: [...prev.history] } : emptyStat()
  stat.lastReviewed = now
  stat.history.push(correct ? 1 : 0)
  if (stat.history.length > HISTORY_CAP) {
    stat.history = stat.history.slice(stat.history.length - HISTORY_CAP)
  }
  if (correct) {
    stat.correct += 1
    stat.streak += 1
    stat.interval = stat.interval === 0 ? 1 : Math.min(60, stat.interval * 2)
    stat.dueAt = now + stat.interval * DAY
  } else {
    stat.incorrect += 1
    stat.streak = 0
    stat.interval = 0
    stat.dueAt = now + 10 * 60 * 1000 // 10 minutes
  }
  return stat
}

/** Higher weight = should appear more often. */
export function selectionWeight(stat: KanaStat | undefined, now = Date.now()): number {
  if (!stat || reps(stat) === 0) return 2
  const acc = recentAccuracy(stat)
  let w = 1 + (1 - acc) * 4
  if (stat.dueAt && now >= stat.dueAt) w *= 1.8
  w *= 1 / (1 + stat.streak * 0.3)
  return Math.max(0.15, w)
}

export type UnitStatus = "mastered" | "learning" | "locked"

export function isUnitMastered(unitId: string, stats: Record<string, KanaStat>): boolean {
  const unit = UNITS_BY_ID[unitId]
  if (!unit) return false
  const targets = unitTargetKana(unit)
  return targets.every((id) => isKanaMastered(stats[id]))
}

export function isUnitUnlocked(unitId: string, stats: Record<string, KanaStat>): boolean {
  const idx = unitIndex(unitId)
  if (idx <= 0) return true
  const prev = UNITS[idx - 1]
  return isUnitMastered(prev.id, stats)
}

export function unitStatus(unitId: string, stats: Record<string, KanaStat>): UnitStatus {
  if (isUnitMastered(unitId, stats)) return "mastered"
  if (isUnitUnlocked(unitId, stats)) return "learning"
  return "locked"
}

export function unitAccuracy(unitId: string, stats: Record<string, KanaStat>): number {
  const unit = UNITS_BY_ID[unitId]
  if (!unit) return 0
  const targets = unitTargetKana(unit)
  const seen = targets.map((id) => stats[id]).filter(Boolean) as KanaStat[]
  if (seen.length === 0) return 0
  const c = seen.reduce((a, s) => a + s.correct, 0)
  const total = seen.reduce((a, s) => a + reps(s), 0)
  return total === 0 ? 0 : c / total
}
