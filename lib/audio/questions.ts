import { getKana, KANA_BY_ID } from "@/lib/kana/data"
import { PRACTICAL_ITEMS_BY_ID } from "@/lib/practical/data"
import { shuffle } from "@/lib/kana/selection"
import type { Kana } from "@/lib/kana/types"
import type { PracticalItem } from "@/lib/practical/types"
import { audioItemKey, audioKanaKey } from "./mastery"

/**
 * Builds "hear the sound → pick the Japanese form" questions. Distractors are
 * chosen to actually train discrimination: the learner's own confusion history
 * comes first, then phonetically (or numerically) similar neighbours, so ka/ga,
 * shi/chi and 7/7時-style mix-ups are surfaced deliberately.
 */

export type AudioKind = "kana" | "practical"

export interface AnswerRef {
  kind: AudioKind
  id: string
}

export interface AudioChoiceOption {
  id: string
  /** Japanese display on the tile — a kana char or a written form. */
  label: string
}

export interface AudioQuestion {
  ref: AnswerRef
  /** Stat key the listening result is recorded against. */
  statKey: string
  /** Japanese text sent to the TTS proxy. */
  audioText: string
  answerId: string
  /** Romaji reading of the answer, used as a fading support aid. */
  romaji: string
  irregular: boolean
  /** Already-shuffled multiple-choice options, including the answer. */
  choices: AudioChoiceOption[]
  kind: AudioKind
}

type ConfusionMap = Record<string, Record<string, number>>

export function statKeyFor(ref: AnswerRef): string {
  return ref.kind === "kana" ? audioKanaKey(ref.id) : audioItemKey(ref.id)
}

function phoneticSim(a: Kana, b: Kana): number {
  let s = 0
  if (a.romaji.slice(-1) === b.romaji.slice(-1)) s += 1 // shares a vowel
  if (a.romaji[0] === b.romaji[0]) s += 1 // shares an initial consonant
  if (a.rowId === b.rowId) s += 1
  return s
}

function valueSim(a: PracticalItem, b: PracticalItem): number {
  if (a.value == null || b.value == null) return 0
  const d = Math.abs(a.value - b.value)
  return d === 0 ? 0 : 1 / (1 + d) // nearer values are more confusable
}

/**
 * Rank candidate distractors by (confusion count, similarity, randomness) and
 * return `n`, keeping a little variety so the same set does not repeat.
 */
function rankDistractors(
  candidates: string[],
  statKey: string,
  toKey: (id: string) => string,
  sim: (id: string) => number,
  n: number,
  confusions?: ConfusionMap,
): string[] {
  const unique = [...new Set(candidates)]
  if (unique.length <= n) return shuffle(unique)
  const conf = confusions?.[statKey] ?? {}
  const scored = unique.map((id) => ({
    id,
    confusion: conf[toKey(id)] ?? 0,
    sim: sim(id),
    r: Math.random(),
  }))
  scored.sort((a, b) => b.confusion - a.confusion || b.sim - a.sim || a.r - b.r)
  const strong = scored.slice(0, Math.max(n + 1, Math.ceil(n * 1.6)))
  return shuffle(strong.map((s) => s.id)).slice(0, n)
}

function kanaDistractors(
  answerId: string,
  pool: string[],
  n: number,
  confusions?: ConfusionMap,
): string[] {
  const answer = getKana(answerId)
  const candidates = pool.filter((id) => {
    if (id === answerId) return false
    const k = KANA_BY_ID[id]
    // Never offer a homophone (e.g. か / カ both read "ka") as a distractor.
    return !!k && k.romaji !== answer.romaji
  })
  return rankDistractors(
    candidates,
    audioKanaKey(answerId),
    (id) => audioKanaKey(id),
    (id) => phoneticSim(getKana(id), answer),
    n,
    confusions,
  )
}

function practicalDistractors(
  answerId: string,
  pool: string[],
  n: number,
  confusions?: ConfusionMap,
): string[] {
  const answer = PRACTICAL_ITEMS_BY_ID[answerId]
  const notHomophone = (id: string) => {
    const it = PRACTICAL_ITEMS_BY_ID[id]
    return !!it && id !== answerId && it.kana !== answer.kana
  }
  let candidates = pool.filter(
    (id) => notHomophone(id) && PRACTICAL_ITEMS_BY_ID[id].category === answer.category,
  )
  if (candidates.length < n) candidates = pool.filter(notHomophone)
  return rankDistractors(
    candidates,
    audioItemKey(answerId),
    (id) => audioItemKey(id),
    (id) => valueSim(PRACTICAL_ITEMS_BY_ID[id], answer),
    n,
    confusions,
  )
}

export function buildQuestion(
  ref: AnswerRef,
  kanaPool: string[],
  practicalPool: string[],
  choiceCount: number,
  confusions?: ConfusionMap,
): AudioQuestion {
  const n = Math.max(1, choiceCount - 1)
  if (ref.kind === "kana") {
    const answer = getKana(ref.id)
    const distractors = kanaDistractors(ref.id, kanaPool, n, confusions)
    const choices = shuffle([ref.id, ...distractors]).map((id) => ({
      id,
      label: getKana(id).char,
    }))
    return {
      ref,
      statKey: audioKanaKey(ref.id),
      audioText: answer.char,
      answerId: ref.id,
      romaji: answer.romaji,
      irregular: false,
      choices,
      kind: "kana",
    }
  }
  const item = PRACTICAL_ITEMS_BY_ID[ref.id]
  const distractors = practicalDistractors(ref.id, practicalPool, n, confusions)
  const choices = shuffle([ref.id, ...distractors]).map((id) => ({
    id,
    label: PRACTICAL_ITEMS_BY_ID[id].written,
  }))
  return {
    ref,
    statKey: audioItemKey(ref.id),
    audioText: item.kana,
    answerId: ref.id,
    romaji: item.romaji,
    irregular: !!item.irregular,
    choices,
    kind: "practical",
  }
}
