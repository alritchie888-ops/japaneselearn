"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Star, Volume2 } from "lucide-react"
import { speak } from "@/lib/audio/speak"
import { replayLimit, speakCredit, speakHint, type SpeakMode } from "@/lib/speak/mastery"
import type { SpeakQuestion } from "@/lib/speak/questions"
import { useRecognizer } from "@/lib/speech/use-recognizer"
import {
  DEFAULT_THRESHOLDS,
  gradeSpoken,
  type SpeakGrade,
  type SpeakVerdict,
} from "@/lib/speech/validation"
import { cn } from "@/lib/utils"
import { MicButton } from "./mic-button"

export interface SpeakResult {
  statKey: string
  /** Whether the lexical reading was correct (close counts as correct reading). */
  readingCorrect: boolean
  /** Mastery credit — first-try, unaided reading success. */
  credit: boolean
  /** Pronunciation confidence in [0,1], only when a reading matched. */
  pron: number | null
  attempts: number
  usedReplay: boolean
  responseMs: number
}

const GRADE_COPY: Record<SpeakGrade, { title: string; tone: string }> = {
  correct: { title: "Correct", tone: "text-success" },
  close: { title: "Close — reading right", tone: "text-primary" },
  incorrect: { title: "Not quite", tone: "text-destructive" },
  unknown: { title: "Didn't catch that", tone: "text-muted-foreground" },
}

/**
 * One "see it → say it" question. Shows the prompt with support that fades by
 * mastery/mode, captures speech, grades the reading in context, and gives
 * lightweight inline feedback — never a modal. Correct/close advance quickly;
 * wrong or unclear answers invite another attempt (recognition failures are
 * free retries and never dent mastery).
 */
export function SpeakPrompt({
  question,
  mode,
  mastery,
  index,
  total,
  micSupported,
  onComplete,
}: {
  question: SpeakQuestion
  mode: SpeakMode
  mastery: number
  index: number
  total: number
  micSupported: boolean
  onComplete: (result: SpeakResult) => void
}) {
  const [verdict, setVerdict] = useState<SpeakVerdict | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [replays, setReplays] = useState(0)
  const [resolved, setResolved] = useState(false)

  const startRef = useRef(0)
  const usedReplayRef = useRef(false)
  const doneRef = useRef(false)

  const hint = speakHint(mode, mastery, question.irregular)
  const limit = replayLimit(mode)
  const canReplay = limit === -1 || replays < limit

  useEffect(() => {
    startRef.current = performance.now()
  }, [])

  const finish = useCallback(
    (v: SpeakVerdict, attemptCount: number) => {
      if (doneRef.current) return
      doneRef.current = true
      const readingCorrect = v.grade === "correct" || v.grade === "close"
      onComplete({
        statKey: question.statKey,
        readingCorrect,
        credit: readingCorrect && speakCredit(attemptCount, usedReplayRef.current),
        pron: readingCorrect ? v.confidence : null,
        attempts: attemptCount,
        usedReplay: usedReplayRef.current,
        responseMs: Math.round(performance.now() - startRef.current),
      })
    },
    [onComplete, question.statKey],
  )

  const handleOutcome = useCallback(
    (verdictResult: SpeakVerdict) => {
      setVerdict(verdictResult)

      // Recognition uncertainty is a free retry — no attempt counted.
      if (verdictResult.grade === "unknown") return

      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)

      if (verdictResult.grade === "correct" || verdictResult.grade === "close") {
        setResolved(true)
        void speak(question.audioText)
        window.setTimeout(() => finish(verdictResult, nextAttempts), 650)
        return
      }
      // Incorrect. In speed mode there are no second chances.
      if (mode === "speed") {
        setResolved(true)
        window.setTimeout(() => finish(verdictResult, nextAttempts), 500)
      }
    },
    [attempts, finish, mode, question.audioText],
  )

  const { state: mic, start, cancel } = useRecognizer({
    onResult: (outcome) => handleOutcome(gradeSpoken(outcome.hypotheses, question.readings, DEFAULT_THRESHOLDS)),
    onError: (kind) => {
      if (kind === "not-allowed") {
        setVerdict({ grade: "unknown", heard: "", confidence: 0 })
      }
    },
  })

  const replay = () => {
    if (!canReplay) return
    usedReplayRef.current = true
    setReplays((r) => r + 1)
    void speak(question.audioText)
  }

  const giveUp = () => finish(verdict ?? { grade: "incorrect", heard: "", confidence: 1 }, attempts || 1)

  const showAnswer = resolved || (verdict?.grade === "incorrect" && attempts >= 2)
  const copy = verdict ? GRADE_COPY[verdict.grade] : null

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {index + 1} <span className="text-muted-foreground/50">/ {total}</span>
      </p>

      {/* Prompt card */}
      <div className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card px-4 py-8">
        {question.promptKind === "recall" && (
          <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Say it in Japanese
          </span>
        )}
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-balance text-center font-jp leading-tight text-foreground",
              question.promptKind === "recall"
                ? "font-sans text-3xl font-bold"
                : question.kind === "kana"
                  ? "text-7xl"
                  : "text-5xl",
            )}
          >
            {question.prompt}
          </p>
          {hint.star > 0 && (
            <Star
              className={cn(
                "size-6 shrink-0",
                hint.star === 2 ? "fill-primary text-primary" : "text-primary/60",
              )}
              aria-label="Irregular reading"
            />
          )}
        </div>

        {/* Fading support */}
        <div className="flex min-h-6 flex-col items-center gap-0.5">
          {hint.showReading && !showAnswer && (
            <span className="font-jp text-lg text-muted-foreground">{question.reading}</span>
          )}
          {hint.showRomaji && !showAnswer && (
            <span className="font-mono text-sm text-muted-foreground/80">{question.romaji}</span>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div className="flex min-h-14 flex-col items-center gap-1 text-center">
        {copy && (
          <p className={cn("text-sm font-semibold", copy.tone)}>{copy.title}</p>
        )}
        {verdict?.heard && verdict.grade !== "correct" && (
          <p className="text-xs text-muted-foreground">
            heard <span className="font-jp text-foreground">{verdict.heard}</span>
          </p>
        )}
        {verdict?.rejection && (
          <p className="text-pretty text-xs text-destructive/90">{verdict.rejection.note}</p>
        )}
        {showAnswer && (
          <p className="text-xs text-muted-foreground">
            Answer: <span className="font-jp text-base text-foreground">{question.reading}</span>
            <span className="ml-1 font-mono text-muted-foreground/70">{question.romaji}</span>
          </p>
        )}
      </div>

      {/* Mic + controls */}
      {micSupported ? (
        <MicButton
          mic={mic}
          grade={resolved ? (verdict?.grade ?? null) : null}
          disabled={resolved}
          onPress={start}
          onCancel={cancel}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          Speech recognition isn&apos;t supported in this browser. Try Chrome or Safari to practice
          speaking.
        </div>
      )}

      <div className="flex items-center gap-3">
        {limit !== 0 && !resolved && (
          <button
            type="button"
            onClick={replay}
            disabled={!canReplay}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors",
              !canReplay && "opacity-50",
            )}
          >
            <Volume2 className="size-3.5" aria-hidden="true" />
            Hear it
          </button>
        )}
        {!resolved && (verdict?.grade === "incorrect" || verdict?.grade === "unknown" || !micSupported) && (
          <button
            type="button"
            onClick={giveUp}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground"
          >
            Skip
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
