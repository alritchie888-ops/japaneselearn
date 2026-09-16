import { ALL_KANA } from "@/lib/kana/data"

/**
 * Maps every kana character to its kana id so a reading string can be broken
 * down into the individual kana a learner must recognise. This is what powers
 * the dependency engine: a lesson's prerequisite kana are *derived* from the
 * kana it actually uses, not hand-maintained.
 */
const SINGLE: Record<string, string> = {}
const DIGRAPH: Record<string, string> = {}

for (const k of ALL_KANA) {
  if (k.char.length === 1) SINGLE[k.char] = k.id
  else DIGRAPH[k.char] = k.id
}

// Small kana that combine with the previous glyph.
const SMALL_Y = "ゃゅょャュョ"
// Sokuon (small tsu) — the learner still needs to recognise it, so credit the
// regular tsu of the matching script.
const SOKUON: Record<string, string> = {
  っ: SINGLE["つ"],
  ッ: SINGLE["ツ"],
}

/** Break a kana reading into the unique kana ids required to read it. */
export function decomposeReading(reading: string): string[] {
  const ids: string[] = []
  let i = 0
  while (i < reading.length) {
    const ch = reading[i]
    const next = reading[i + 1]

    if (ch === "ー" || ch === "・" || ch === " ") {
      i += 1
      continue
    }
    if (SOKUON[ch]) {
      ids.push(SOKUON[ch])
      i += 1
      continue
    }
    if (next && SMALL_Y.includes(next)) {
      const two = ch + next
      if (DIGRAPH[two]) {
        ids.push(DIGRAPH[two])
      } else if (SINGLE[ch]) {
        ids.push(SINGLE[ch])
      }
      i += 2
      continue
    }
    if (SINGLE[ch]) ids.push(SINGLE[ch])
    i += 1
  }
  return [...new Set(ids)]
}
