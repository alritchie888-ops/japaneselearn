import { getKana } from "@/lib/kana/data"
import { PRACTICAL_ITEMS_BY_ID } from "@/lib/practical/data"
import type { PracticalItem } from "@/lib/practical/types"

/**
 * Context-aware spoken readings. The same character has different correct
 * readings depending on context (7 → なな as a bare number, しちじ in 7時), so a
 * generic speech-to-text match is NOT automatically correct. Each item resolves
 * to an explicit set of accepted readings plus a curated set of common-but-wrong
 * readings that must be rejected even when the recognizer understood them.
 */

export interface RejectedReading {
  reading: string
  /** Short learner-facing explanation of why this reading is wrong here. */
  note: string
}

export interface ItemReadings {
  /** Canonical reading used for TTS and the on-screen support hint. */
  canonical: string
  /** Every reading counted as correct in this context (hiragana). */
  accepted: string[]
  /** Wrong-but-plausible readings, surfaced as targeted corrections. */
  rejected: RejectedReading[]
}

/**
 * Curated overrides for context-sensitive forms. Only the irregular / high-value
 * cases are listed; everything else falls back to accepting the item's own kana
 * reading (and any declared altReadings). Rejected readings are deliberately the
 * mistakes a learner actually makes by applying the regular pattern.
 */
const OVERRIDES: Record<string, Partial<ItemReadings>> = {
  // Bare numbers — both readings are legitimate, なな/しち and きゅう/く.
  "num-4": { accepted: ["よん", "し"] },
  "num-7": { accepted: ["なな", "しち"] },
  "num-9": { accepted: ["きゅう", "く"] },

  // Hours: 時 forces one specific reading.
  "time-h4": { accepted: ["よじ"], rejected: [{ reading: "よんじ", note: "4時 is よじ, never よんじ" }] },
  "time-h7": { accepted: ["しちじ"], rejected: [{ reading: "ななじ", note: "7時 is しちじ, never ななじ" }] },
  "time-h9": { accepted: ["くじ"], rejected: [{ reading: "きゅうじ", note: "9時 is くじ, never きゅうじ" }] },

  // Minutes with classic sound changes.
  "time-m1": { accepted: ["いっぷん"], rejected: [{ reading: "いちふん", note: "1分 becomes いっぷん" }] },
  "time-m3": { accepted: ["さんぷん"], rejected: [{ reading: "さんふん", note: "3分 takes ぷん: さんぷん" }] },
  "time-m6": { accepted: ["ろっぷん"], rejected: [{ reading: "ろくふん", note: "6分 becomes ろっぷん" }] },
  "time-m8": { accepted: ["はっぷん"], rejected: [{ reading: "はちふん", note: "8分 becomes はっぷん" }] },
  "time-m10": { accepted: ["じゅっぷん", "じっぷん"], rejected: [{ reading: "じゅうふん", note: "10分 is じゅっぷん" }] },

  // Months: 4/7/9 are irregular.
  "cal-mon4": { accepted: ["しがつ"], rejected: [{ reading: "よんがつ", note: "April is しがつ, never よんがつ" }] },
  "cal-mon7": { accepted: ["しちがつ"], rejected: [{ reading: "なながつ", note: "July is しちがつ, never なながつ" }] },
  "cal-mon9": { accepted: ["くがつ"], rejected: [{ reading: "きゅうがつ", note: "September is くがつ" }] },

  // Dates: native readings for the first ten days and the special teens/twenties.
  "cal-d1": { accepted: ["ついたち"], rejected: [{ reading: "いちにち", note: "The 1st is ついたち; いちにち means 'one day' (duration)" }] },
  "cal-d2": { accepted: ["ふつか"], rejected: [{ reading: "ににち", note: "The 2nd is ふつか" }] },
  "cal-d3": { accepted: ["みっか"], rejected: [{ reading: "さんにち", note: "The 3rd is みっか" }] },
  "cal-d4": { accepted: ["よっか"], rejected: [{ reading: "よんにち", note: "The 4th is よっか" }] },
  "cal-d5": { accepted: ["いつか"], rejected: [{ reading: "ごにち", note: "The 5th is いつか" }] },
  "cal-d6": { accepted: ["むいか"], rejected: [{ reading: "ろくにち", note: "The 6th is むいか" }] },
  "cal-d7": { accepted: ["なのか"], rejected: [{ reading: "しちにち", note: "The 7th is なのか" }] },
  "cal-d8": { accepted: ["ようか"], rejected: [{ reading: "はちにち", note: "The 8th is ようか" }] },
  "cal-d9": { accepted: ["ここのか"], rejected: [{ reading: "くにち", note: "The 9th is ここのか" }] },
  "cal-d10": { accepted: ["とおか"], rejected: [{ reading: "じゅうにち", note: "The 10th is とおか" }] },
  "cal-d14": { accepted: ["じゅうよっか"], rejected: [{ reading: "じゅうよんにち", note: "The 14th keeps よっか: じゅうよっか" }] },
  "cal-d20": { accepted: ["はつか"], rejected: [{ reading: "にじゅうにち", note: "The 20th is はつか, never にじゅうにち" }] },
  "cal-d24": { accepted: ["にじゅうよっか"], rejected: [{ reading: "にじゅうよんにち", note: "The 24th keeps よっか: にじゅうよっか" }] },

  // Counting people: 一人/二人 are native.
  "cnt-p1": { accepted: ["ひとり"], rejected: [{ reading: "いちにん", note: "1 person is ひとり" }] },
  "cnt-p2": { accepted: ["ふたり"], rejected: [{ reading: "ににん", note: "2 people is ふたり" }] },
  "cnt-p4": { accepted: ["よにん"], rejected: [{ reading: "よんにん", note: "4 people is よにん" }] },

  // Long-object counter 本 sound changes.
  "cnt-hon1": { accepted: ["いっぽん"], rejected: [{ reading: "いちほん", note: "1 long object is いっぽん" }] },
  "cnt-hon3": { accepted: ["さんぼん"], rejected: [{ reading: "さんほん", note: "3 becomes さんぼん" }] },
  "cnt-hon6": { accepted: ["ろっぽん"], rejected: [{ reading: "ろくほん", note: "6 becomes ろっぽん" }] },

  // Hundreds/thousands sound changes.
  "num-h300": { accepted: ["さんびゃく"], rejected: [{ reading: "さんひゃく", note: "300 is さんびゃく" }] },
  "num-h600": { accepted: ["ろっぴゃく"], rejected: [{ reading: "ろくひゃく", note: "600 is ろっぴゃく" }] },
  "num-h800": { accepted: ["はっぴゃく"], rejected: [{ reading: "はちひゃく", note: "800 is はっぴゃく" }] },
  "num-k3000": { accepted: ["さんぜん"], rejected: [{ reading: "さんせん", note: "3,000 is さんぜん" }] },
  "num-k8000": { accepted: ["はっせん"], rejected: [{ reading: "はちせん", note: "8,000 is はっせん" }] },

  // Age: 二十歳 is fully irregular.
  "age-1": { accepted: ["いっさい"], rejected: [{ reading: "いちさい", note: "1 year old is いっさい" }] },
  "age-8": { accepted: ["はっさい"], rejected: [{ reading: "はちさい", note: "8 years old is はっさい" }] },
  "age-10": { accepted: ["じゅっさい", "じっさい"], rejected: [{ reading: "じゅうさい", note: "10 years old is じゅっさい" }] },
  "age-20": { accepted: ["はたち"], rejected: [{ reading: "にじゅっさい", note: "20 years old is はたち, never にじゅっさい" }] },

  // Duration 1日 contrasts with the date ついたち.
  "dur-day1": { accepted: ["いちにち"], rejected: [{ reading: "ついたち", note: "As a duration this is いちにち; ついたち is the 1st of the month" }] },
}

// Fix a typo-safe entry above (cal-mon7 needs a proper rejected reading).
OVERRIDES["cal-mon7"] = {
  accepted: ["しちがつ"],
  rejected: [{ reading: "なながつ", note: "July is しちがつ, never なながつ" }],
}

/** Accepted spoken readings for a kana glyph (katakana resolves to its sound). */
export function kanaReadings(kanaId: string): ItemReadings {
  const k = getKana(kanaId)
  const hira = toHiragana(k.char)
  const extras: Record<string, string[]> = {
    // Sounds a Japanese recognizer tends to return for these rare/particle kana.
    を: ["を", "お"],
    ぢ: ["ぢ", "じ"],
    づ: ["づ", "ず"],
    ヲ: ["お"],
    ヂ: ["じ"],
    ヅ: ["ず"],
  }
  const accepted = extras[k.char] ?? [hira]
  return { canonical: hira, accepted, rejected: [] }
}

/** Resolve the full accepted/rejected reading set for a practical item. */
export function itemReadings(itemId: string): ItemReadings {
  const item = PRACTICAL_ITEMS_BY_ID[itemId]
  if (!item) return { canonical: "", accepted: [], rejected: [] }
  return readingsFor(item)
}

function readingsFor(item: PracticalItem): ItemReadings {
  const override = OVERRIDES[item.id]
  const base = new Set<string>([item.kana])
  for (const alt of item.altReadings ?? []) base.add(alt.kana)
  if (override?.accepted) for (const r of override.accepted) base.add(r)
  return {
    canonical: item.kana,
    accepted: [...base].map(toHiragana),
    rejected: (override?.rejected ?? []).map((r) => ({ ...r, reading: toHiragana(r.reading) })),
  }
}

const KATA_START = 0x30a1
const KATA_END = 0x30f6

/** Fold katakana to hiragana and normalize the prolonged-sound mark. */
export function toHiragana(input: string): string {
  let out = ""
  for (const ch of input) {
    const code = ch.codePointAt(0)!
    if (code >= KATA_START && code <= KATA_END) {
      out += String.fromCodePoint(code - 0x60)
    } else {
      out += ch
    }
  }
  return out
}
