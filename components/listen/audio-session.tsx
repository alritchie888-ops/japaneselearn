"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Ear, Gauge, RotateCcw, Target, Trophy } from "lucide-react"
import { masteryScore } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import { buildAudioSession, categoryStatus, LISTEN_CATEGORIES, type ListenCategory } from "@/lib/audio/track"
import { prefetchSpeak } from "@/lib/audio/speak"
import type { AudioQuestion } from "@/lib/audio/questions"
import type { ListenMode } from "@/lib/audio/mastery"
import { ScreenHeader } from "@/components/screen-header"
import { AudioChoice, type AudioResult } from "./audio-choice"
import { cn } from "@/lib/utils"

type Phase = "config" | "running" | "done"

const MODES: { key: ListenMode; label: string; icon: typeof Ear; blurb: string }[] = [
  { key: "practice", label: "Practice", icon: Ear, blurb: "Unlimited replays, hints on" },
  { key: "mastery", label: "Mastery", icon: Target, blurb: "One replay, no hints" },
  { key: "speed", label: "Speed", icon: Gauge, blurb: "Autoplay, race the clock" },
]

const LENGTHS: Record<ListenMode, (number | string)[]> = {
  practice: [10, 20, 30],
  mastery: [10, 20, 30],
  speed: [10, 20, 30, "60s"],
}

export function AudioSession({ category }: { category: ListenCategory }) {
  const { state, hydrated, recordAnswer, completeSession, recordListen } = useProgress()
  const meta = LISTEN_CATEGORIES.find((c) => c.key === category)

  const [phase, setPhase] = useState<Phase>("config")
  const [mode, setMode] = useState<ListenMode>("practice")
  const [length, setLength] = useState<number | string>(20)
  const [questions, setQuestions] = useState<AudioQuestion[]>([])
  const [index, setIndex] = useState(0)
  const results = useRef<AudioResult[]>([])
  const startedAt = useRef(0)
  const [summary, setSummary] = useState<{
    total: number
    firstTry: number
    avgMs: number
    replays: number
    timeMs: number
    isBest: boolean
  } | null>(null)

  const status = useMemo(
    () => (hydrated ? categoryStatus(category, state) : { available: false, count: 0, mastery: 0 }),
    [hydrated, category, state],
  )

  const timed = mode === "speed" && length === "60s"

  const finishSession = useCallback(() => {
    const rs = results.current
    const total = rs.length
    const firstTry = rs.filter((r) => r.firstTry && r.correct).length
    const replays = rs.reduce((a, r) => a + r.replays, 0)
    const avgMs = total ? Math.round(rs.reduce((a, r) => a + r.responseMs, 0) / total) : 0
    const timeMs = Math.round(performance.now() - startedAt.current)
    completeSession()
    let isBest = false
    if (mode === "speed" && total > 0) {
      isBest = recordListen(String(length), {
        timeMs,
        accuracy: firstTry / total,
        avgMs,
        mistakes: total - firstTry,
      })
    }
    setSummary({ total, firstTry, avgMs, replays, timeMs, isBest })
    setPhase("done")
  }, [completeSession, length, mode, recordListen])

  const handleComplete = useCallback(
    (r: AudioResult) => {
      recordAnswer(r.statKey, r.correct, r.confusedWith ? { confusedWith: r.confusedWith } : undefined)
      results.current.push(r)
      const next = index + 1
      // Prefetch the upcoming clip so playback is instant.
      if (questions[next + 1]) prefetchSpeak(questions[next + 1].audioText)
      if (next >= questions.length) {
        finishSession()
      } else {
        setIndex(next)
      }
    },
    [index, questions, recordAnswer, finishSession],
  )

  const start = useCallback(() => {
    const count = timed ? 80 : Number(length)
    const built = buildAudioSession(category, state, count)
    if (built.length === 0) return
    results.current = []
    setQuestions(built)
    setIndex(0)
    setSummary(null)
    startedAt.current = performance.now()
    if (built[1]) prefetchSpeak(built[1].audioText)
    setPhase("running")
  }, [category, length, state, timed])

  if (!meta) return null

  if (!hydrated) {
    return (
      <>
        <ScreenHeader title="Listen" />
        <div className="space-y-3 p-4">
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        </div>
      </>
    )
  }

  if (phase === "config") {
    return (
      <>
        <ScreenHeader title={meta.title} subtitle={meta.blurb} back="/listen" />
        <div className="space-y-6 p-4">
          {!status.available ? (
            <div className="rounded-3xl border border-border bg-card p-6 text-center">
              <Ear className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Nothing to hear here yet. Learn more kana and practical readings first, then come
                back to train your ear.
              </p>
            </div>
          ) : (
            <>
              <section>
                <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">Mode</h2>
                <div className="space-y-2">
                  {MODES.map((m) => {
                    const Icon = m.icon
                    const active = mode === m.key
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setMode(m.key)
                          if (!LENGTHS[m.key].includes(length)) setLength(LENGTHS[m.key][1] ?? LENGTHS[m.key][0])
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                          active ? "border-primary bg-accent" : "border-border bg-card",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-9 items-center justify-center rounded-full",
                            active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{m.label}</span>
                          <span className="block text-xs text-muted-foreground">{m.blurb}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">Length</h2>
                <div className="flex flex-wrap gap-2">
                  {LENGTHS[mode].map((l) => (
                    <button
                      key={String(l)}
                      type="button"
                      onClick={() => setLength(l)}
                      className={cn(
                        "min-w-16 rounded-xl border px-4 py-2.5 text-sm font-semibold tabular-nums transition-colors",
                        length === l
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      {l === "60s" ? "60s" : `${l}`}
                    </button>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={start}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.99]"
              >
                <Ear className="size-4" aria-hidden="true" />
                Start listening
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  if (phase === "running") {
    const q = questions[index]
    const mastery = masteryScore(state.stats[q.statKey])
    return (
      <>
        <ScreenHeader title={meta.title} back="/listen" />
        <div className="pt-2">
          <div className="mx-4 mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((index) / questions.length) * 100}%` }}
            />
          </div>
          <AudioChoice
            key={index}
            question={q}
            mode={mode}
            mastery={mastery}
            index={index}
            total={questions.length}
            onComplete={handleComplete}
          />
        </div>
      </>
    )
  }

  // done
  const s = summary!
  const acc = s.total ? Math.round((s.firstTry / s.total) * 100) : 0
  return (
    <>
      <ScreenHeader title="Session complete" back="/listen" />
      <div className="space-y-6 p-4">
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          {mode === "speed" && s.isBest ? (
            <Trophy className="mx-auto mb-2 size-9 text-primary" aria-hidden="true" />
          ) : (
            <Ear className="mx-auto mb-2 size-9 text-primary" aria-hidden="true" />
          )}
          <p className="text-4xl font-bold tabular-nums text-foreground">{acc}%</p>
          <p className="mt-1 text-sm text-muted-foreground">heard right on the first try</p>
          {mode === "speed" && (
            <p className="mt-3 text-sm font-semibold text-primary">
              {(s.timeMs / 1000).toFixed(1)}s{s.isBest ? " · new best!" : ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Metric value={String(s.total)} label="Sounds" />
          <Metric value={`${(s.avgMs / 1000).toFixed(1)}s`} label="Avg answer" />
          <Metric value={String(s.replays)} label="Replays" />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPhase("config")}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Again
          </button>
          <Link
            href="/listen"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
          >
            Done
          </Link>
        </div>
      </div>
    </>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
