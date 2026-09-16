import type { SpeechHypothesis } from "./recognizer"
import { toHiragana, type ItemReadings, type RejectedReading } from "./readings"

/**
 * Turns raw recognizer hypotheses into a learning verdict. This layer is kept
 * completely separate from lesson scoring: it only decides WHAT was said and how
 * well it matches the expected reading in context. It never mutates mastery.
 *
 * Reading correctness and pronunciation confidence are deliberately NOT merged:
 * a clear voice saying the wrong reading is "incorrect", while the right reading
 * said unclearly is "close". Low recognizer certainty yields "unknown" so the
 * learner can simply try again without a mastery penalty.
 */

export type SpeakGrade = "correct" | "close" | "incorrect" | "unknown"

export interface SpeakThresholds {
  /** At/above this confidence a correct-reading match is fully "correct". */
  high: number
  /** Below this, a lone hypothesis is too uncertain to judge → "unknown". */
  low: number
  /** Max edit distance (per reading length) still treated as a near-miss. */
  nearRatio: number
}

export const DEFAULT_THRESHOLDS: SpeakThresholds = {
  high: 0.6,
  low: 0.3,
  nearRatio: 0.34,
}

export interface SpeakVerdict {
  grade: SpeakGrade
  /** Best-guess transcript shown back to the learner. */
  heard: string
  /** Confidence in [0,1] the verdict is based on. */
  confidence: number
  /** The accepted reading that matched, when correct/close. */
  matched?: string
  /** Explanation when a specific wrong reading was recognized. */
  rejection?: RejectedReading
}

/** Digits and spacing a recognizer may attach; stripped before comparison. */
function normalize(text: string): string {
  return toHiragana(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000・。、,.!?！？"'’”「」]/g, "")
    .replace(/ー/g, "")
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diag = tmp
    }
  }
  return prev[b.length]
}

/** Web Speech sometimes reports confidence 0; treat that as "unstated, trust the match". */
function effectiveConfidence(raw: number): number {
  return raw > 0 ? raw : 0.85
}

/**
 * Grade a set of hypotheses against the accepted/rejected readings for the
 * current context. Considers every alternative, not just the top one, so a
 * correct reading buried in the alternatives still counts.
 */
export function gradeSpoken(
  hypotheses: SpeechHypothesis[],
  readings: ItemReadings,
  thresholds: SpeakThresholds = DEFAULT_THRESHOLDS,
): SpeakVerdict {
  const heard = hypotheses[0]?.transcript ?? ""
  if (hypotheses.length === 0 || !heard.trim()) {
    return { grade: "unknown", heard, confidence: 0 }
  }

  const accepted = readings.accepted.map(normalize).filter(Boolean)
  const rejected = readings.rejected.map((r) => ({ ...r, norm: normalize(r.reading) }))

  let bestAccept: { conf: number; reading: string } | null = null
  let bestNear: { conf: number; reading: string } | null = null
  let bestReject: { conf: number; rej: RejectedReading } | null = null

  for (const hyp of hypotheses) {
    const said = normalize(hyp.transcript)
    if (!said) continue
    const conf = effectiveConfidence(hyp.confidence)

    // Exact accepted reading.
    if (accepted.includes(said)) {
      if (!bestAccept || conf > bestAccept.conf) bestAccept = { conf, reading: said }
      continue
    }
    // Explicit wrong reading for this context.
    const rej = rejected.find((r) => r.norm === said)
    if (rej) {
      if (!bestReject || conf > bestReject.conf) bestReject = { conf, rej }
      continue
    }
    // Near-miss on an accepted reading → likely a pronunciation slip.
    for (const acc of accepted) {
      const dist = levenshtein(said, acc)
      const tol = Math.max(1, Math.round(acc.length * thresholds.nearRatio))
      if (dist <= tol && (!bestNear || conf > bestNear.conf)) {
        bestNear = { conf, reading: acc }
      }
    }
  }

  if (bestAccept) {
    const grade: SpeakGrade = bestAccept.conf >= thresholds.high ? "correct" : "close"
    return { grade, heard, confidence: bestAccept.conf, matched: bestAccept.reading }
  }
  if (bestReject && bestReject.conf >= thresholds.low) {
    return { grade: "incorrect", heard, confidence: bestReject.conf, rejection: bestReject.rej }
  }
  if (bestNear) {
    return { grade: "close", heard, confidence: bestNear.conf, matched: bestNear.reading }
  }

  // Nothing matched. If the recognizer itself was unsure, invite a retry;
  // otherwise the learner clearly said the wrong thing.
  const topConf = effectiveConfidence(hypotheses[0].confidence)
  if (topConf < thresholds.low) return { grade: "unknown", heard, confidence: topConf }
  return { grade: "incorrect", heard, confidence: topConf }
}
