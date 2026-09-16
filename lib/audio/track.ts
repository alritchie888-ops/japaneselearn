import { ALL_KANA, UNITS_BY_ID } from "@/lib/kana/data"
import { unitTargetKana } from "@/lib/kana/curriculum"
import { ALL_PRACTICAL_ITEMS } from "@/lib/practical/data"
import { itemNeedsSupport } from "@/lib/practical/dependency"
import { masteryScore, reps, selectionWeight } from "@/lib/store/mastery"
import type { PracticalCategory } from "@/lib/practical/types"
import type { ProgressState } from "@/lib/store/progress"
import { audioItemKey, audioKanaKey, avgListeningMastery } from "./mastery"
import { buildQuestion, statKeyFor, type AnswerRef, type AudioQuestion } from "./questions"

/**
 * The Listen track. Every pool respects the dependency engine: audio questions
 * never ask the learner to identify a form built from kana they cannot yet read
 * reliably, and only sounds they have already met appear as distractors.
 */

export type ListenCategory =
  | "current"
  | "kana"
  | "numbers"
  | "time"
  | "calendar"
  | "counters"
  | "weak"
  | "mixed"

export interface ListenCategoryMeta {
  key: ListenCategory
  title: string
  jp: string
  blurb: string
}

export const LISTEN_CATEGORIES: ListenCategoryMeta[] = [
  { key: "current", title: "Current Lesson", jp: "いまのくん", blurb: "The row you're learning right now" },
  { key: "kana", title: "Kana", jp: "かな", blurb: "Every sound you've met so far" },
  { key: "numbers", title: "Numbers", jp: "すうじ", blurb: "Hear a number, pick the digits" },
  { key: "time", title: "Time", jp: "じかん", blurb: "Hear a time, pick the clock" },
  { key: "calendar", title: "Calendar", jp: "カレンダー", blurb: "Hear a date, pick it out" },
  { key: "counters", title: "Counters", jp: "じょすうし", blurb: "Hear a count, pick the form" },
  { key: "weak", title: "Weak Sounds", jp: "にがてなおと", blurb: "The sounds you keep missing" },
  { key: "mixed", title: "Mixed Review", jp: "ミックス", blurb: "Everything you know, shuffled" },
]

const PRACTICAL_CATS: Partial<Record<ListenCategory, PracticalCategory>> = {
  numbers: "numbers",
  time: "time",
  calendar: "calendar",
  counters: "counters",
}

type Stats = ProgressState["stats"]

const kanaRef = (id: string): AnswerRef => ({ kind: "kana", id })
const itemRef = (id: string): AnswerRef => ({ kind: "practical", id })

/** Kana the learner has actually seen — safe to hear and safe as distractors. */
function learnedKana(stats: Stats): string[] {
  return ALL_KANA.filter((k) => reps(stats[k.id]) > 0).map((k) => k.id)
}

/** Practical items whose every required kana is reliable (never an unknown
 *  sound + unknown kana at once), optionally filtered to one category. */
function readablePractical(stats: Stats, category?: PracticalCategory): string[] {
  return ALL_PRACTICAL_ITEMS.filter((it) => {
    if (category && it.category !== category) return false
    return !itemNeedsSupport(it.id, stats)
  }).map((it) => it.id)
}

function weakRefs(stats: Stats): AnswerRef[] {
  const refs: AnswerRef[] = []
  for (const k of ALL_KANA) {
    const key = audioKanaKey(k.id)
    if (reps(stats[key]) >= 1 && masteryScore(stats[key]) < 0.7) refs.push(kanaRef(k.id))
  }
  for (const it of ALL_PRACTICAL_ITEMS) {
    const key = audioItemKey(it.id)
    if (reps(stats[key]) >= 1 && masteryScore(stats[key]) < 0.7) refs.push(itemRef(it.id))
  }
  return refs
}

export interface AudioPool {
  answers: AnswerRef[]
  kanaPool: string[]
  practicalPool: string[]
}

export function categoryPool(category: ListenCategory, state: ProgressState): AudioPool {
  const stats = state.stats
  const kanaLearned = learnedKana(stats)

  if (category === "current") {
    const unit = UNITS_BY_ID[state.lastUnitId ?? "hira-a"] ?? UNITS_BY_ID["hira-a"]
    const targets = unitTargetKana(unit)
    return {
      answers: targets.map(kanaRef),
      kanaPool: [...new Set([...targets, ...kanaLearned])],
      practicalPool: [],
    }
  }
  if (category === "kana") {
    return { answers: kanaLearned.map(kanaRef), kanaPool: kanaLearned, practicalPool: [] }
  }
  if (category === "weak") {
    return {
      answers: weakRefs(stats),
      kanaPool: kanaLearned,
      practicalPool: readablePractical(stats),
    }
  }
  if (category === "mixed") {
    const p = readablePractical(stats)
    return {
      answers: [...kanaLearned.map(kanaRef), ...p.map(itemRef)],
      kanaPool: kanaLearned,
      practicalPool: p,
    }
  }
  const cat = PRACTICAL_CATS[category]
  const ids = readablePractical(stats, cat)
  return { answers: ids.map(itemRef), kanaPool: [], practicalPool: ids }
}

export interface CategoryStatus {
  available: boolean
  count: number
  mastery: number
}

export function categoryStatus(category: ListenCategory, state: ProgressState): CategoryStatus {
  const pool = categoryPool(category, state)
  return {
    available: pool.answers.length > 0,
    count: pool.answers.length,
    mastery: avgListeningMastery(pool.answers.map(statKeyFor), state.stats),
  }
}

/** Weighted sample WITH repetition, avoiding immediate repeats. */
function weightedPicks(refs: AnswerRef[], stats: Stats, n: number): AnswerRef[] {
  if (refs.length === 0) return []
  const out: AnswerRef[] = []
  let last: string | null = null
  for (let i = 0; i < n; i++) {
    const weights = refs.map((r) => {
      const key = statKeyFor(r)
      const w = selectionWeight(stats[key])
      return key === last ? w * 0.15 : w
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let x = Math.random() * total
    let idx = 0
    for (let j = 0; j < refs.length; j++) {
      x -= weights[j]
      if (x <= 0) {
        idx = j
        break
      }
    }
    out.push(refs[idx])
    last = statKeyFor(refs[idx])
  }
  return out
}

/**
 * Build a session of `count` questions. Difficulty is adaptive: more options
 * appear once the learner's listening mastery of the pool climbs.
 */
export function buildAudioSession(
  category: ListenCategory,
  state: ProgressState,
  count: number,
): AudioQuestion[] {
  const pool = categoryPool(category, state)
  if (pool.answers.length === 0) return []
  const stats = state.stats
  const avg = avgListeningMastery(pool.answers.map(statKeyFor), stats)
  const choiceCount = avg < 0.35 ? 4 : avg < 0.7 ? 5 : 6
  const picks = weightedPicks(pool.answers, stats, count)
  return picks.map((ref) =>
    buildQuestion(ref, pool.kanaPool, pool.practicalPool, choiceCount, state.confusions),
  )
}
