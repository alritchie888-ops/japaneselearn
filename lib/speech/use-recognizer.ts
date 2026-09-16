"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getSpeechProvider,
  type SpeechErrorKind,
  type SpeechOutcome,
} from "./recognizer"

export type MicState = "idle" | "listening" | "processing"

interface UseRecognizerArgs {
  onResult: (outcome: SpeechOutcome) => void
  onError?: (kind: SpeechErrorKind) => void
}

/**
 * Thin React binding over the provider abstraction. It owns only the visible
 * mic state machine (idle → listening → processing) and forwards results; all
 * judging lives in the validation layer. The microphone is engaged only when
 * `start` is called and released as soon as the utterance ends or is cancelled.
 */
export function useRecognizer({ onResult, onError }: UseRecognizerArgs) {
  const provider = useRef(getSpeechProvider())
  const [supported] = useState(() => provider.current.supported)
  const [state, setState] = useState<MicState>("idle")

  const resultRef = useRef(onResult)
  const errorRef = useRef(onError)
  resultRef.current = onResult
  errorRef.current = onError

  const start = useCallback(() => {
    setState("listening")
    provider.current.start({
      onStart: () => setState("listening"),
      onSpeechEnd: () => setState("processing"),
      onResult: (outcome) => resultRef.current(outcome),
      onError: (kind) => errorRef.current?.(kind),
      onEnd: () => setState("idle"),
    })
  }, [])

  const stop = useCallback(() => {
    setState("processing")
    provider.current.stop()
  }, [])

  const cancel = useCallback(() => {
    provider.current.abort()
    setState("idle")
  }, [])

  // Always release the mic if the component unmounts mid-listen.
  useEffect(() => {
    const p = provider.current
    return () => p.abort()
  }, [])

  return { supported, state, start, stop, cancel }
}
