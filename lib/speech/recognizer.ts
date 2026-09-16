/**
 * Provider-agnostic speech recognition. The learning logic never talks to a
 * concrete recognizer — it depends only on these interfaces, so the browser
 * Web Speech provider here can be swapped for a cloud provider later without
 * touching any scoring or lesson code.
 */

export interface SpeechHypothesis {
  /** Recognized text, as returned by the provider (may be kana or kanji). */
  transcript: string
  /** Provider confidence in [0,1]. 0 when the provider gives none. */
  confidence: number
}

export interface SpeechOutcome {
  /** Ranked hypotheses, best first. Empty when nothing was recognized. */
  hypotheses: SpeechHypothesis[]
}

export type SpeechErrorKind =
  | "no-speech"
  | "aborted"
  | "not-allowed"
  | "network"
  | "unsupported"
  | "unknown"

export interface SpeechListenHandlers {
  onResult: (outcome: SpeechOutcome) => void
  onError: (kind: SpeechErrorKind) => void
  /** Fired once the session ends, regardless of result/error. */
  onEnd: () => void
  /** Fired when the provider begins capturing audio. */
  onStart?: () => void
  /** Fired when the provider detects the user has stopped speaking. */
  onSpeechEnd?: () => void
}

export interface SpeechProvider {
  readonly supported: boolean
  /** Begin a single-utterance recognition session. */
  start(handlers: SpeechListenHandlers): void
  /** Stop capturing and finalize the current result. */
  stop(): void
  /** Cancel without producing a result. */
  abort(): void
}

interface BrowserSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechend: (() => void) | null
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<
    ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }
  >
}

type RecognitionCtor = new () => BrowserSpeechRecognition

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function mapError(code: string): SpeechErrorKind {
  switch (code) {
    case "no-speech":
      return "no-speech"
    case "aborted":
      return "aborted"
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed"
    case "network":
      return "network"
    default:
      return "unknown"
  }
}

/**
 * Browser Web Speech API provider. Single-utterance, Japanese by default, with
 * several alternatives requested so the validator can consider more than the
 * top hypothesis before deciding a reading is wrong.
 */
export class BrowserSpeechProvider implements SpeechProvider {
  private recognition: BrowserSpeechRecognition | null = null
  private readonly lang: string

  constructor(lang = "ja-JP") {
    this.lang = lang
  }

  get supported(): boolean {
    return getCtor() !== null
  }

  start(handlers: SpeechListenHandlers): void {
    const Ctor = getCtor()
    if (!Ctor) {
      handlers.onError("unsupported")
      handlers.onEnd()
      return
    }
    // Ensure a stale session never overlaps a new one.
    this.abort()

    const rec = new Ctor()
    rec.lang = this.lang
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 5
    this.recognition = rec

    let delivered = false

    rec.onstart = () => handlers.onStart?.()
    rec.onspeechend = () => {
      handlers.onSpeechEnd?.()
      // Finalize promptly once the learner stops talking.
      try {
        rec.stop()
      } catch {
        /* no-op */
      }
    }
    rec.onresult = (event) => {
      const first = event.results[0]
      if (!first) return
      const hypotheses: SpeechHypothesis[] = []
      for (let i = 0; i < first.length; i++) {
        const alt = first[i]
        if (alt?.transcript) {
          hypotheses.push({ transcript: alt.transcript, confidence: alt.confidence ?? 0 })
        }
      }
      delivered = true
      handlers.onResult({ hypotheses })
    }
    rec.onerror = (event) => handlers.onError(mapError(event.error))
    rec.onend = () => {
      if (!delivered) handlers.onResult({ hypotheses: [] })
      handlers.onEnd()
      this.recognition = null
    }

    try {
      rec.start()
    } catch {
      // Calling start twice in quick succession throws; treat as aborted.
      handlers.onError("aborted")
      handlers.onEnd()
      this.recognition = null
    }
  }

  stop(): void {
    try {
      this.recognition?.stop()
    } catch {
      /* no-op */
    }
  }

  abort(): void {
    const rec = this.recognition
    if (!rec) return
    rec.onresult = null
    rec.onerror = null
    rec.onend = null
    rec.onstart = null
    rec.onspeechend = null
    try {
      rec.abort()
    } catch {
      /* no-op */
    }
    this.recognition = null
  }
}

let shared: SpeechProvider | null = null

/** The default browser provider, created lazily and reused. */
export function getSpeechProvider(): SpeechProvider {
  if (!shared) shared = new BrowserSpeechProvider("ja-JP")
  return shared
}
