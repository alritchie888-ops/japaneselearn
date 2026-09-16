import type { Kana, KanaType, Script, Unit } from "./types"

/**
 * Kana are defined once as script-agnostic rows, then materialized for both
 * hiragana and katakana. This keeps the character data separate from UI logic.
 */

interface RowSpec {
  rowId: string
  type: KanaType
  /** [romaji, hiraganaChar, katakanaChar] */
  entries: [string, string, string][]
}

interface RowGroup {
  /** Base row id, also the unit id suffix. */
  rowId: string
  label: string
  base: RowSpec
  variations: RowSpec[]
  combos: RowSpec[]
}

const GROUPS: RowGroup[] = [
  {
    rowId: "a",
    label: "A-row",
    base: {
      rowId: "a",
      type: "base",
      entries: [
        ["a", "あ", "ア"],
        ["i", "い", "イ"],
        ["u", "う", "ウ"],
        ["e", "え", "エ"],
        ["o", "お", "オ"],
      ],
    },
    variations: [],
    combos: [],
  },
  {
    rowId: "k",
    label: "K-row",
    base: {
      rowId: "k",
      type: "base",
      entries: [
        ["ka", "か", "カ"],
        ["ki", "き", "キ"],
        ["ku", "く", "ク"],
        ["ke", "け", "ケ"],
        ["ko", "こ", "コ"],
      ],
    },
    variations: [
      {
        rowId: "g",
        type: "voiced",
        entries: [
          ["ga", "が", "ガ"],
          ["gi", "ぎ", "ギ"],
          ["gu", "ぐ", "グ"],
          ["ge", "げ", "ゲ"],
          ["go", "ご", "ゴ"],
        ],
      },
    ],
    combos: [
      {
        rowId: "ky",
        type: "combo",
        entries: [
          ["kya", "きゃ", "キャ"],
          ["kyu", "きゅ", "キュ"],
          ["kyo", "きょ", "キョ"],
        ],
      },
      {
        rowId: "gy",
        type: "combo",
        entries: [
          ["gya", "ぎゃ", "ギャ"],
          ["gyu", "ぎゅ", "ギュ"],
          ["gyo", "ぎょ", "ギョ"],
        ],
      },
    ],
  },
  {
    rowId: "s",
    label: "S-row",
    base: {
      rowId: "s",
      type: "base",
      entries: [
        ["sa", "さ", "サ"],
        ["shi", "し", "シ"],
        ["su", "す", "ス"],
        ["se", "せ", "セ"],
        ["so", "そ", "ソ"],
      ],
    },
    variations: [
      {
        rowId: "z",
        type: "voiced",
        entries: [
          ["za", "ざ", "ザ"],
          ["ji", "じ", "ジ"],
          ["zu", "ず", "ズ"],
          ["ze", "ぜ", "ゼ"],
          ["zo", "ぞ", "ゾ"],
        ],
      },
    ],
    combos: [
      {
        rowId: "sh",
        type: "combo",
        entries: [
          ["sha", "しゃ", "シャ"],
          ["shu", "しゅ", "シュ"],
          ["sho", "しょ", "ショ"],
        ],
      },
      {
        rowId: "j",
        type: "combo",
        entries: [
          ["ja", "じゃ", "ジャ"],
          ["ju", "じゅ", "ジュ"],
          ["jo", "じょ", "ジョ"],
        ],
      },
    ],
  },
  {
    rowId: "t",
    label: "T-row",
    base: {
      rowId: "t",
      type: "base",
      entries: [
        ["ta", "た", "タ"],
        ["chi", "ち", "チ"],
        ["tsu", "つ", "ツ"],
        ["te", "て", "テ"],
        ["to", "と", "ト"],
      ],
    },
    variations: [
      {
        rowId: "d",
        type: "voiced",
        entries: [
          ["da", "だ", "ダ"],
          ["dji", "ぢ", "ヂ"],
          ["dzu", "づ", "ヅ"],
          ["de", "で", "デ"],
          ["do", "ど", "ド"],
        ],
      },
    ],
    combos: [
      {
        rowId: "ch",
        type: "combo",
        entries: [
          ["cha", "ちゃ", "チャ"],
          ["chu", "ちゅ", "チュ"],
          ["cho", "ちょ", "チョ"],
        ],
      },
    ],
  },
  {
    rowId: "n",
    label: "N-row",
    base: {
      rowId: "n",
      type: "base",
      entries: [
        ["na", "な", "ナ"],
        ["ni", "に", "ニ"],
        ["nu", "ぬ", "ヌ"],
        ["ne", "ね", "ネ"],
        ["no", "の", "ノ"],
      ],
    },
    variations: [],
    combos: [
      {
        rowId: "ny",
        type: "combo",
        entries: [
          ["nya", "にゃ", "ニャ"],
          ["nyu", "にゅ", "ニュ"],
          ["nyo", "にょ", "ニョ"],
        ],
      },
    ],
  },
  {
    rowId: "h",
    label: "H-row",
    base: {
      rowId: "h",
      type: "base",
      entries: [
        ["ha", "は", "ハ"],
        ["hi", "ひ", "ヒ"],
        ["fu", "ふ", "フ"],
        ["he", "へ", "ヘ"],
        ["ho", "ほ", "ホ"],
      ],
    },
    variations: [
      {
        rowId: "b",
        type: "voiced",
        entries: [
          ["ba", "ば", "バ"],
          ["bi", "び", "ビ"],
          ["bu", "ぶ", "ブ"],
          ["be", "べ", "ベ"],
          ["bo", "ぼ", "ボ"],
        ],
      },
      {
        rowId: "p",
        type: "semi-voiced",
        entries: [
          ["pa", "ぱ", "パ"],
          ["pi", "ぴ", "ピ"],
          ["pu", "ぷ", "プ"],
          ["pe", "ぺ", "ペ"],
          ["po", "ぽ", "ポ"],
        ],
      },
    ],
    combos: [
      {
        rowId: "hy",
        type: "combo",
        entries: [
          ["hya", "ひゃ", "ヒャ"],
          ["hyu", "ひゅ", "ヒュ"],
          ["hyo", "ひょ", "ヒョ"],
        ],
      },
      {
        rowId: "by",
        type: "combo",
        entries: [
          ["bya", "びゃ", "ビャ"],
          ["byu", "びゅ", "ビュ"],
          ["byo", "びょ", "ビョ"],
        ],
      },
      {
        rowId: "py",
        type: "combo",
        entries: [
          ["pya", "ぴゃ", "ピャ"],
          ["pyu", "ぴゅ", "ピュ"],
          ["pyo", "ぴょ", "ピョ"],
        ],
      },
    ],
  },
  {
    rowId: "m",
    label: "M-row",
    base: {
      rowId: "m",
      type: "base",
      entries: [
        ["ma", "ま", "マ"],
        ["mi", "み", "ミ"],
        ["mu", "む", "ム"],
        ["me", "め", "メ"],
        ["mo", "も", "モ"],
      ],
    },
    variations: [],
    combos: [
      {
        rowId: "my",
        type: "combo",
        entries: [
          ["mya", "みゃ", "ミャ"],
          ["myu", "みゅ", "ミュ"],
          ["myo", "みょ", "ミョ"],
        ],
      },
    ],
  },
  {
    rowId: "y",
    label: "Y-row",
    base: {
      rowId: "y",
      type: "base",
      entries: [
        ["ya", "や", "ヤ"],
        ["yu", "ゆ", "ユ"],
        ["yo", "よ", "ヨ"],
      ],
    },
    variations: [],
    combos: [],
  },
  {
    rowId: "r",
    label: "R-row",
    base: {
      rowId: "r",
      type: "base",
      entries: [
        ["ra", "ら", "ラ"],
        ["ri", "り", "リ"],
        ["ru", "る", "ル"],
        ["re", "れ", "レ"],
        ["ro", "ろ", "ロ"],
      ],
    },
    variations: [],
    combos: [
      {
        rowId: "ry",
        type: "combo",
        entries: [
          ["rya", "りゃ", "リャ"],
          ["ryu", "りゅ", "リュ"],
          ["ryo", "りょ", "リョ"],
        ],
      },
    ],
  },
  {
    rowId: "w",
    label: "W-row",
    base: {
      rowId: "w",
      type: "base",
      entries: [
        ["wa", "わ", "ワ"],
        ["wo", "を", "ヲ"],
      ],
    },
    variations: [],
    combos: [],
  },
  {
    rowId: "nn",
    label: "N (ん)",
    base: {
      rowId: "nn",
      type: "base",
      entries: [["n", "ん", "ン"]],
    },
    variations: [],
    combos: [],
  },
]

function makeId(script: Script, rowId: string, romaji: string): string {
  return `${script === "hiragana" ? "hira" : "kata"}-${rowId}-${romaji}`
}

function buildKana(script: Script): { kana: Kana[]; units: Unit[] } {
  const kana: Kana[] = []
  const units: Unit[] = []
  const charIndex = script === "hiragana" ? 1 : 2

  for (const group of GROUPS) {
    const specToIds = (spec: RowSpec): string[] =>
      spec.entries.map(([romaji, ...chars]) => {
        const id = makeId(script, spec.rowId, romaji)
        kana.push({
          id,
          char: chars[charIndex - 1],
          romaji,
          script,
          rowId: spec.rowId,
          type: spec.type,
        })
        return id
      })

    const base = specToIds(group.base)
    const variations = group.variations.map(specToIds)
    const combos = group.combos.flatMap(specToIds)

    units.push({
      id: `${script === "hiragana" ? "hira" : "kata"}-${group.rowId}`,
      script,
      rowId: group.rowId,
      label: group.label,
      base,
      variations,
      combos,
    })
  }

  return { kana, units }
}

const hira = buildKana("hiragana")
const kata = buildKana("katakana")

export const ALL_KANA: Kana[] = [...hira.kana, ...kata.kana]

export const KANA_BY_ID: Record<string, Kana> = Object.fromEntries(
  ALL_KANA.map((k) => [k.id, k]),
)

/** Curriculum units in learning order: all hiragana, then all katakana. */
export const UNITS: Unit[] = [...hira.units, ...kata.units]

export const UNITS_BY_ID: Record<string, Unit> = Object.fromEntries(
  UNITS.map((u) => [u.id, u]),
)

export function getKana(id: string): Kana {
  return KANA_BY_ID[id]
}

export function unitAllKana(unit: Unit): string[] {
  return [...unit.base, ...unit.variations.flat(), ...unit.combos]
}
