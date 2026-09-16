export type Script = "hiragana" | "katakana"

export type KanaType = "base" | "voiced" | "semi-voiced" | "combo"

export interface Kana {
  /** Stable unique id, e.g. "hira-k-ka" or "kata-ky-kya" */
  id: string
  /** The rendered character, e.g. か */
  char: string
  /** Romanized reading, e.g. "ka" */
  romaji: string
  script: Script
  /** The row this kana belongs to, e.g. "k" */
  rowId: string
  type: KanaType
}

/** A single learning unit in the curriculum (one row group). */
export interface Unit {
  id: string
  script: Script
  rowId: string
  label: string
  /** Base kana ids for the row. */
  base: string[]
  /** Voiced / semi-voiced variation groups (each an array of kana ids). */
  variations: string[][]
  /** Combination (youon) kana ids relevant to this row. */
  combos: string[]
}
