"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Award, Gauge, Mic, RotateCcw, Sparkles, Target, Trophy } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { masteryScore } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import { getSpeechProvider } from "@/lib/speech/recognizer"
import { buildSpeakSession, type SpeakCategory, type SpeakCategoryMeta } from "@/lib/speak/track"
import type { SpeakMode } from "@/lib/speak/mastery"
import type { SpeakQuestion } from "@/lib/speak/questions"
import { cn } from "@/lib/utils"
import { SpeakPrompt, type SpeakResult } from "./speak-prompt"

type Phase = "config" | "running" | "summary"

interface ModeOption {
  key: SpeakMode
  title: string
  jp: string
  blurb: string
  icon: typeof Target
}

const MODES: ModeOption[] = [
  { key: "practice", title: "Practice", jp: "れんしゅう", blurb: "Full support, replay anytime", icon: Sparkles },
  { key: "mastery", title: "Mastery", jp: "しけん", blurb: "No hints, one shot to prove it", icon: Target },
  { key: "speed", title: "Speed", jp: "スピード", blurb: "Say them as fast as you can", icon: Gauge },
]

const SPEED_60 = "60s"

export function SpeakSession({
  category,
  meta,
}: {
  category: SpeakCategory
  meta: SpeakCategoryMeta
}) {
  const { state, recordAnswer, recordSpeak, recordPron, completeSession } = useProgress()

  const [phase, setPhase] = useState<Phase>("config")
  const [mode, setMode] = useState<SpeakMode>("practice")
  const [lengthKey, setLengthKey] = useState<string>("10")
  const [questions, setQuestions] = useState<SpeakQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<SpeakResult[]>([])
  const [isBest, setIsBest] = useState(false)

  const micSupported = useMemo(() => getSpeechProvider().supported, [])

  // 60-second speed challenge timing.
  const [timeLeft, setTimeLeft] = useState(60)
  const deadlineRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)

  const isSpeed = mode === "speed"
  const is60 = isSpeed && lengthKey === SPEED_60

  const buildCount = is60 ? 120 : Number(lengthKey)

  const begin = useCallback(() => {
    const built = buildSpeakSession(category, state, buildCount)
    if (built.length === 0) return
    setQuestions(built)
    setIndex(0)
    setResults([])
    setIsBest(false)
    startedAtRef.current = performance.now()
    if (is60) {
      deadlineRef.current = performance.now() + 60_000
      setTimeLeft(60)
    } else {
      deadlineRef.current = null
    }
    setPhase("running")
  }, [buildCount, category, is60, state])

  // Countdown for the 60s challenge.
  useEffect(() => {
    if (phase !== "running" || !is60) return
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil(((deadlineRef.current ?? 0) - performance.now()) / 1000))
      setTimeLeft(left)
      if (left <= 0) window.clearInterval(id)
    }, 250)
    return () => window.clearInterval(id)
  }, [phase, is60])

  const finishSession = useCallback(
    (finalResults: SpeakResult[]) => {
      completeSession()
      if (isSpeed) {
        const graded = finalResults.filter((r) => r.attempts > 0)
        const correct = graded.filter((r) => r.readingCorrect).length
        const accuracy = graded.length ? correct / graded.length : 0
        const totalMs = graded.reduce((a, r) => a + r.responseMs, 0)
        const avgMs = graded.length ? Math.round(totalMs / graded.length) : 0
        const key = is60 ? `${category}:60s` : category
        const record = is60
          ? { timeMs: correct, accuracy, avgMs, mistakes: graded.length - correct }
          : { timeMs: Math.round(performance.now() - startedAtRef.current), accuracy, avgMs, mistakes: graded.length - correct }
        // For the 60s mode "best" means most correct; recordSpeak compares timeMs
        // ascending, so store negative count to make "more correct" win.
        const best = recordSpeak(key, is60 ? { ...record, timeMs: -correct } : record)
        setIsBest(best)
      }
      setPhase("summary")
    },
    [category, completeSession, is60, isSpeed, recordSpeak],
  )

  const handleComplete = useCallback(
    (result: SpeakResult) => {
      recordAnswer(result.statKey, result.credit)
      if (result.pron != null) recordPron(result.statKey, result.pron)

      setResults((prev) => {
        const next = [...prev, result]
        const outOfTime = is60 && (deadlineRef.current ?? 0) <= performance.now()
        if (index + 1 >= questions.length || outOfTime) {
          finishSession(next)
        } else {
          setIndex((i) => i + 1)
        }
        return next
      })
    },
    [finishSession, index, is60, questions.length, recordAnswer, recordPron],
  )

  // ---- Config phase ----
  if (phase === "config") {
    const lengthOptions = isSpeed
      ? [
          { key: "20", label: "20 prompts" },
          { key: SPEED_60, label: "60-second challenge" },
        ]
      : [
          { key: "10", label: "10 prompts" },
          { key: "20", label: "20 prompts" },
        ]
    return (
      <div>
        <ScreenHeader title={`Speak · ${meta.title}`} subtitle={meta.blurb} back="/speak" />
        <div className="space-y-6 px-4 py-5">
          {!micSupported && (
            <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              This browser can&apos;t capture speech. You can still review answers, but for full
              speaking practice open the app in Chrome or Safari.
            </div>
          )}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Choose a mode</h2>
            <div className="grid gap-2.5">
              {MODES.map((m) => {
                const Icon = m.icon
                const active = mode === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setMode(m.key)
                      setLengthKey(m.key === "speed" ? "20" : "10")
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold text-foreground">{m.title}</span>
                        <span className="font-jp text-xs text-muted-foreground">{m.jp}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{m.blurb}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Length</h2>
            <div className="flex flex-wrap gap-2">
              {lengthOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLengthKey(opt.key)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    lengthKey === opt.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={begin}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.99]"
          >
            <Mic className="size-5" aria-hidden="true" />
            Start speaking
          </button>
        </div>
      </div>
    )
  }

  // ---- Running phase ----
  if (phase === "running") {
    const q = questions[index]
    const mastery = masteryScore(state.stats[q.statKey])
    return (
      <div>
        <ScreenHeader title={meta.title} back="/speak" />
        {is60 && (
          <div className="px-4">
            <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-2 text-sm">
              <span className="font-medium text-muted-foreground">Time</span>
              <span className={cn("font-mono font-bold tabular-nums", timeLeft <= 10 ? "text-destructive" : "text-foreground")}>
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
        <SpeakPrompt
          key={index}
          question={q}
          mode={mode}
          mastery={mastery}
          index={index}
          total={is60 ? results.length + 1 : questions.length}
          micSupported={micSupported}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  // ---- Summary phase ----
  const graded = results.filter((r) => r.attempts > 0)
  const correct = graded.filter((r) => r.readingCorrect).length
  const clean = graded.filter((r) => r.credit).length
  const accuracy = graded.length ? Math.round((correct / graded.length) * 100) : 0
  const pronScores = graded.filter((r) => r.pron != null).map((r) => r.pron as number)
  const avgPron = pronScores.length
    ? Math.round((pronScores.reduce((a, b) => a + b, 0) / pronScores.length) * 100)
    : null

  return (
    <div>
      <ScreenHeader title="Session complete" back="/speak" />
      <div className="space-y-6 px-4 py-6">
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isBest ? <Trophy className="size-8" aria-hidden="true" /> : <Award className="size-8" aria-hidden="true" />}
          </span>
          <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
          <p className="text-sm text-muted-foreground">reading accuracy</p>
          {isBest && is60 && (
            <p className="text-sm font-semibold text-primary">New best — {correct} correct in 60s!</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Correct" value={`${correct}/${graded.length}`} />
          <Stat label="First-try" value={String(clean)} />
          <Stat label="Pronunciation" value={avgPron == null ? "—" : `${avgPron}%`} />
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setPhase("config")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Speak again
          </button>
          <Link
            href="/speak"
            className="flex w-full items-center justify-center rounded-2xl border border-border bg-card py-3.5 font-semibold text-foreground"
          >
            Back to categories
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-4">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  )
}
