import { getKana } from "@/lib/kana/data"
import { PRACTICAL_ITEMS_BY_ID } from "@/lib/practical/data"
import type { AnswerRef, AudioKind } from "@/lib/audio/questions"
import { itemReadings, kanaReadings, type ItemReadings } from "@/lib/speech/readings"
import { speakItemKey, speakKanaKey } from "./mastery"

/**
 * A single "see it → say it" prompt. There are no multiple-choice distractors:
 * the learner produces the reading aloud and the speech validator judges it. A
 * `recall` prompt shows the meaning/real-world form instead of the Japanese, so
 * the learner must generate the Japanese from scratch (the hardest stage).
 */

export type SpeakPromptKind = "jp" | "recall"

export interface SpeakQuestion {
  ref: AnswerRef
  kind: AudioKind
  statKey: string
  promptKind: SpeakPromptKind
  /** Main text shown to the learner — Japanese, or a meaning for recall. */
  prompt: string
  /** Canonical kana reading, used for the audio replay and support hint. */
  reading: string
  romaji: string
  /** Text sent to the TTS proxy for the "hear it" replay. */
  audioText: string
  meaning: string
  irregular: boolean
  readings: ItemReadings
}

export function buildSpeakQuestion(ref: AnswerRef, promptKind: SpeakPromptKind): SpeakQuestion {
  if (ref.kind === "kana") {
    const k = getKana(ref.id)
    const readings = kanaReadings(ref.id)
    return {
      ref,
      kind: "kana",
      statKey: speakKanaKey(ref.id),
      promptKind: "jp",
      prompt: k.char,
      reading: readings.canonical,
      romaji: k.romaji,
      audioText: k.char,
      meaning: k.romaji,
      irregular: false,
      readings,
    }
  }
  const item = PRACTICAL_ITEMS_BY_ID[ref.id]
  const readings = itemReadings(ref.id)
  return {
    ref,
    kind: "practical",
    statKey: speakItemKey(ref.id),
    promptKind,
    prompt: promptKind === "recall" ? item.meaning : item.written,
    reading: item.kana,
    romaji: item.romaji,
    audioText: item.kana,
    meaning: item.meaning,
    irregular: !!item.irregular,
    readings,
  }
}
