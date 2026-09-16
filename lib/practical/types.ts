import type { Script } from "@/lib/kana/types"

/** Top-level content domains in the practical Japanese track. */
export type PracticalCategory =
  | "numbers"
  | "time"
  | "calendar"
  | "counters"
  | "duration"
  | "money"
  | "age"
  | "combos"

/** How aggressively romaji is shown as a learning aid. */
export type RomajiMode = "on" | "fade" | "off"

/** An alternate reading for a form (e.g. 4 = よん / し). */
export interface AltReading {
  kana: string
  romaji: string
  note?: string
}

/**
 * A single practical item — a written Japanese form and how to read it.
 * Irregularity (gold star) and readings are reusable properties across every
 * category, never hard-coded per module.
 */
export interface PracticalItem {
  id: string
  category: PracticalCategory
  /** Written form as shown to the learner, e.g. "14日", "4時", "¥1,000". */
  written: string
  /** Canonical kana reading, e.g. "じゅうよっか". */
  kana: string
  /** Romanized reading used as the initial learning aid. */
  romaji: string
  /** English gloss or value description. */
  meaning: string
  /** Numeric value where relevant (sorting, money, etc.). */
  value?: number
  /** Marks a special / irregular reading — drives the universal gold star. */
  irregular?: boolean
  /** Preferred everyday reading label when several exist. */
  altReadings?: AltReading[]
  /** Related item ids (e.g. the date 1日 relates to the duration 一日). */
  related?: string[]
  /**
   * Kana ids required to READ this item, in addition to the ones derived
   * automatically from `kana`. Rarely needed.
   */
  extraPrereqKana?: string[]
  /** Script the reading is written in (almost always hiragana). */
  script?: Script
}

/** A lesson: an ordered group of practical items in one category. */
export interface PracticalModule {
  id: string
  category: PracticalCategory
  title: string
  jpTitle: string
  blurb: string
  itemIds: string[]
  /** Modules that should be learned first (soft ordering hint). */
  after?: string[]
}
