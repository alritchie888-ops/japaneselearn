import { ALL_KANA, UNITS_BY_ID } from "@/lib/kana/data"
import { unitTargetKana } from "@/lib/kana/curriculum"
import { ALL_PRACTICAL_ITEMS } from "@/lib/practical/data"
import { itemNeedsSupport } from "@/lib/practical/dependency"
import { balancedSample } from "@/lib/kana/selection"
import { masteryScore, reps, selectionWeight } from "@/lib/store/mastery"
import type { PracticalCategory } from "@/lib/practical/types"
import type { ProgressState } from "@/lib/store/progress"
import { audioKanaKey, audioItemKey } from "@/lib/audio/mastery"
import type { AnswerRef } from "@/lib/audio/questions"
import { avgSpeakingMastery, speakItemKey, speakKanaKey } from "./mastery"
import { buildSpeakQuestion, type SpeakPromptKind, type SpeakQuestion } from "./questions"

/**
 * The Speak track. Speaking unlocks only AFTER the learner shows enough
 * recognition of the underlying material (recognition → listening → speaking),
 * so a form is offered for production once it is familiar — not once it is
 * perfect. Every pool still respects the kana dependency engine, so no prompt
 * asks the learner to produce a form built from kana they cannot yet read.
 */

export type SpeakCategory =
  | "current"
  | "kana"
  | "numbers"
  | "time"
  | "calendar"
  | "counters"
  | "weak"
  | "mixed"
  | "recall"

export interface SpeakCategoryMeta {
  key: SpeakCategory
  title: string
  jp: string
  blurb: string
  /** Recall prompts show the meaning; everything else shows the Japanese. */
  promptKind: SpeakPromptKind
}

export const SPEAK_CATEGORIES: SpeakCategoryMeta[] = [
  { key: "current", title: "Current Lesson", jp: "いまのくん", blurb: "Say the row you're learning now", promptKind: "jp" },
  { key: "kana", title: "Kana", jp: "かな", blurb: "Speak every sound you've met", promptKind: "jp" },
  { key: "numbers", title: "Numbers", jp: "すうじ", blurb: "Read numbers aloud", promptKind: "jp" },
  { key: "time", title: "Time", jp: "じかん", blurb: "Say the clock time", promptKind: "jp" },
  { key: "calendar", title: "Calendar", jp: "カレンダー", blurb: "Speak dates and days", promptKind: "jp" },
  { key: "counters", title: "Counters", jp: "じょすうし", blurb: "Say the counter form", promptKind: "jp" },
  { key: "weak", title: "Weak Speaking", jp: "にがて", blurb: "The forms you keep missing", promptKind: "jp" },
  { key: "mixed", title: "Mixed Speaking", jp: "ミックス", blurb: "Everything you can say, shuffled", promptKind: "jp" },
  { key: "recall", title: "Practical Recall", jp: "そうさん", blurb: "See the meaning, produce the Japanese", promptKind: "recall" },
]

const PRACTICAL_CATS: Partial<Record<SpeakCategory, PracticalCategory>> = {
  numbers: "numbers",
  time: "time",
  calendar: "calendar",
  counters: "counters",
}

type Stats = ProgressState["stats"]

const kanaRef = (id: string): AnswerRef => ({ kind: "kana", id })
const itemRef = (id: string): AnswerRef => ({ kind: "practical", id })

/**
 * A kana is ready to SPEAK once it is familiar by sight or ear — decent visual
 * mastery, or a few reps, or any listening exposure. This keeps active recall
 * productive without demanding perfection first.
 */
function speakReadyKana(kanaId: string, stats: Stats): boolean {
  const visual = stats[kanaId]
  if (masteryScore(visual) >= 0.5 || reps(visual) >= 3) return true
  return reps(stats[audioKanaKey(kanaId)]) > 0
}

function speakableKana(stats: Stats): string[] {
  return ALL_KANA.filter((k) => speakReadyKana(k.id, stats)).map((k) => k.id)
}

/** Practical items whose kana are all reliable AND that are themselves familiar. */
function speakablePractical(stats: Stats, category?: PracticalCategory): string[] {
  return ALL_PRACTICAL_ITEMS.filter((it) => {
    if (category && it.category !== category) return false
    if (itemNeedsSupport(it.id, stats)) return false
    const visual = stats[it.id]
    const heard = reps(stats[audioItemKey(it.id)]) > 0
    return masteryScore(visual) >= 0.5 || reps(visual) >= 3 || heard
  }).map((it) => it.id)
}

function weakRefs(stats: Stats): AnswerRef[] {
  const refs: AnswerRef[] = []
  for (const k of ALL_KANA) {
    const key = speakKanaKey(k.id)
    if (reps(stats[key]) >= 1 && masteryScore(stats[key]) < 0.7) refs.push(kanaRef(k.id))
  }
  for (const it of ALL_PRACTICAL_ITEMS) {
    const key = speakItemKey(it.id)
    if (reps(stats[key]) >= 1 && masteryScore(stats[key]) < 0.7) refs.push(itemRef(it.id))
  }
  return refs
}

export interface SpeakPool {
  answers: AnswerRef[]
  promptKind: SpeakPromptKind
}

export function categoryPool(category: SpeakCategory, state: ProgressState): SpeakPool {
  const stats = state.stats
  const kana = speakableKana(stats)

  if (category === "current") {
    const unit = UNITS_BY_ID[state.lastUnitId ?? "hira-a"] ?? UNITS_BY_ID["hira-a"]
    const targets = unitTargetKana(unit).filter((id) => speakReadyKana(id, stats))
    return { answers: targets.map(kanaRef), promptKind: "jp" }
  }
  if (category === "kana") {
    return { answers: kana.map(kanaRef), promptKind: "jp" }
  }
  if (category === "weak") {
    return { answers: weakRefs(stats), promptKind: "jp" }
  }
  if (category === "mixed") {
    return {
      answers: [...kana.map(kanaRef), ...speakablePractical(stats).map(itemRef)],
      promptKind: "jp",
    }
  }
  if (category === "recall") {
    // Only practical items carry a meaning worth recalling from.
    return { answers: speakablePractical(stats).map(itemRef), promptKind: "recall" }
  }
  const cat = PRACTICAL_CATS[category]
  return { answers: speakablePractical(stats, cat).map(itemRef), promptKind: "jp" }
}

export interface CategoryStatus {
  available: boolean
  count: number
  mastery: number
}

export function categoryStatus(category: SpeakCategory, state: ProgressState): CategoryStatus {
  const pool = categoryPool(category, state)
  const keys = pool.answers.map((r) =>
    r.kind === "kana" ? speakKanaKey(r.id) : speakItemKey(r.id),
  )
  return {
    available: pool.answers.length > 0,
    count: pool.answers.length,
    mastery: avgSpeakingMastery(keys, state.stats),
  }
}

/**
 * Coverage-first weighted sample. A normal session works through the whole
 * pool before repeating; "weak" practice leans into repetition so the forms
 * the learner keeps missing come back around more often.
 */
function pickAnswers(
  refs: AnswerRef[],
  stats: Stats,
  n: number,
  bias: "coverage" | "targeted",
): AnswerRef[] {
  if (refs.length === 0) return []
  const keyOf = (r: AnswerRef) => (r.kind === "kana" ? speakKanaKey(r.id) : speakItemKey(r.id))
  const byKey = new Map<string, AnswerRef>()
  for (const r of refs) byKey.set(keyOf(r), r)
  const keys = balancedSample([...byKey.keys()], {
    n,
    bias,
    weightOf: (key) => selectionWeight(stats[key]),
  })
  return keys.map((k) => byKey.get(k) as AnswerRef)
}

/** Build a speaking session of `count` prompts for a category. */
export function buildSpeakSession(
  category: SpeakCategory,
  state: ProgressState,
  count: number,
): SpeakQuestion[] {
  const pool = categoryPool(category, state)
  if (pool.answers.length === 0) return []
  const bias = category === "weak" ? "targeted" : "coverage"
  const picks = pickAnswers(pool.answers, state.stats, count, bias)
  return picks.map((ref) => buildSpeakQuestion(ref, pool.promptKind))
}
