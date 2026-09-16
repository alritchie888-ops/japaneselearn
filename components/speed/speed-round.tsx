"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Trophy, Zap } from "lucide-react"
import { UNITS, getKana, unitAllKana } from "@/lib/kana/data"
import { unitStatus } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import type { Script } from "@/lib/kana/types"
import { shuffle, weightedSample } from "@/lib/kana/selection"
import { PRACTICAL_MODULES, getPracticalItem } from "@/lib/practical/data"
import { moduleReadiness } from "@/lib/practical/dependency"
import { itemStatKey } from "@/lib/practical/mastery"
import { KanaGlyph } from "@/components/kana-glyph"
import { ScreenHeader } from "@/components/screen-header"
import { ResultCard } from "@/components/session/result-card"
import { cn } from "@/lib/utils"

type ContentType = "kana" | "practical"
type ScriptScope = "hiragana" | "katakana" | "both"
type DirMode = "forward" | "reverse"
type Phase = "config" | "playing" | "summary"

interface Option {
  id: string
  label: string
  jp: boolean
}
interface Question {
  /** Option id that is the correct answer. */
  correctId: string
  /** Stat key to record the result under. */
  recordId: string
  prompt: string
  promptJp: boolean
  options: Option[]
}

const COUNTS = [10, 20, 30]

export function SpeedRound() {
  const { state, hydrated, recordAnswer, recordSpeed, completeSession } = useProgress()
  const [content, setContent] = useState<ContentType>("kana")
  const [scope, setScope] = useState<ScriptScope>("both")
  const [dir, setDir] = useState<DirMode>("reverse")
  const [count, setCount] = useState(10)
  const [phase, setPhase] = useState<Phase>("config")

  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isBest, setIsBest] = useState(false)

  const startTime = useRef(0)
  const mistakes = useRef(0)
  const finalTime = useRef(0)

  // best-time keys are namespaced so kana and practical leaderboards stay separate.
  const speedKey = content === "practical" ? `p${count}` : String(count)

  const kanaPool = useMemo(() => {
    const scripts: Script[] = scope === "both" ? ["hiragana", "katakana"] : [scope]
    const ids: string[] = []
    for (const u of UNITS) {
      if (!scripts.includes(u.script)) continue
      if (unitStatus(u.id, state.stats) === "locked") continue
      ids.push(...unitAllKana(u))
    }
    return [...new Set(ids)]
  }, [scope, state.stats])

  const practicalPool = useMemo(() => {
    const ids: string[] = []
    for (const m of PRACTICAL_MODULES) {
      if (moduleReadiness(m.id, state.stats).state === "locked") continue
      ids.push(...m.itemIds)
    }
    return [...new Set(ids)]
  }, [state.stats])

  const pool = content === "practical" ? practicalPool : kanaPool

  const buildKanaQuestions = useCallback(
    (n: number): Question[] => {
      const picks = weightedSample(kanaPool, state.stats, Math.min(n, kanaPool.length))
      return picks.map((id) => {
        const k = getKana(id)
        const distractors = shuffle(kanaPool.filter((x) => x !== id)).slice(0, 3)
        const ids = shuffle([id, ...distractors])
        return {
          correctId: id,
          recordId: id,
          prompt: dir === "reverse" ? k.char : k.romaji,
          promptJp: dir === "reverse",
          options: ids.map((oid) => {
            const ok = getKana(oid)
            return dir === "reverse"
              ? { id: oid, label: ok.romaji, jp: false }
              : { id: oid, label: ok.char, jp: true }
          }),
        }
      })
    },
    [kanaPool, state.stats, dir],
  )

  const buildPracticalQuestions = useCallback(
    (n: number): Question[] => {
      const picks = shuffle(practicalPool).slice(0, Math.min(n, practicalPool.length))
      return picks.flatMap((id) => {
        const item = getPracticalItem(id)
        if (!item) return []
        // Prefer distractors from the same category, then fall back to the pool.
        const sameCat = practicalPool.filter(
          (x) => x !== id && getPracticalItem(x)?.category === item.category,
        )
        const backfill = practicalPool.filter((x) => x !== id && !sameCat.includes(x))
        const distractors = [...shuffle(sameCat), ...shuffle(backfill)].slice(0, 3)
        const ids = shuffle([id, ...distractors])
        const reverse = dir === "forward" // forward here = meaning → written
        return [
          {
            correctId: id,
            recordId: itemStatKey(id, reverse ? "reverse" : "forward"),
            prompt: reverse ? item.meaning : item.written,
            promptJp: !reverse,
            options: ids.map((oid) => {
              const oi = getPracticalItem(oid)!
              return reverse
                ? { id: oid, label: oi.written, jp: true }
                : { id: oid, label: oi.meaning, jp: false }
            }),
          },
        ]
      })
    },
    [practicalPool, dir],
  )

  // Tick the timer while playing.
  useEffect(() => {
    if (phase !== "playing") return
    const t = window.setInterval(() => setElapsed(Date.now() - startTime.current), 100)
    return () => window.clearInterval(t)
  }, [phase])

  const start = useCallback(() => {
    const qs = content === "practical" ? buildPracticalQuestions(count) : buildKanaQuestions(count)
    setQuestions(qs)
    setIndex(0)
    setPicked(null)
    mistakes.current = 0
    startTime.current = Date.now()
    setElapsed(0)
    setPhase("playing")
  }, [content, buildKanaQuestions, buildPracticalQuestions, count])

  const finish = useCallback(() => {
    finalTime.current = Date.now() - startTime.current
    const correct = questions.length - mistakes.current
    const accuracy = questions.length ? correct / questions.length : 1
    const best = recordSpeed(speedKey, {
      timeMs: finalTime.current,
      accuracy,
      avgMs: questions.length ? finalTime.current / questions.length : 0,
      mistakes: mistakes.current,
    })
    setIsBest(best)
    completeSession()
    setPhase("summary")
  }, [questions.length, speedKey, recordSpeed, completeSession])

  const handlePick = useCallback(
    (optionId: string) => {
      if (picked) return
      const q = questions[index]
      const correct = optionId === q.correctId
      if (!correct) {
        mistakes.current += 1
        recordAnswer(q.recordId, false, { confusedWith: optionId })
      } else {
        recordAnswer(q.recordId, true)
      }
      setPicked(optionId)
      window.setTimeout(() => {
        if (index < questions.length - 1) {
          setIndex((i) => i + 1)
          setPicked(null)
        } else {
          finish()
        }
      }, 420)
    },
    [picked, questions, index, recordAnswer, finish],
  )

  if (!hydrated) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  if (phase === "summary") {
    const t = finalTime.current
    const correct = questions.length - mistakes.current
    const acc = questions.length ? Math.round((correct / questions.length) * 100) : 100
    const best = state.bestSpeed[speedKey]
    return (
      <>
        <ScreenHeader title="Speed round" back="/speed" />
        <ResultCard
          tone={isBest ? "success" : "primary"}
          icon={
            isBest ? (
              <Trophy className="size-9" aria-hidden="true" />
            ) : (
              <Zap className="size-9" aria-hidden="true" />
            )
          }
          title={isBest ? "New best time!" : "Round complete"}
          subtitle={
            best && !isBest
              ? `Your best for ${count} cards is ${(best.timeMs / 1000).toFixed(1)}s`
              : `${count} cards done`
          }
          stats={[
            { label: "Time", value: `${(t / 1000).toFixed(1)}s` },
            { label: "Accuracy", value: `${acc}%` },
            { label: "Avg", value: `${(t / 1000 / Math.max(1, questions.length)).toFixed(2)}s` },
          ]}
        >
          <button
            type="button"
            onClick={start}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Race again
          </button>
          <button
            type="button"
            onClick={() => setPhase("config")}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Change settings
          </button>
        </ResultCard>
      </>
    )
  }

  if (phase === "playing") {
    const q = questions[index]
    if (!q) return null
    return (
      <>
        <ScreenHeader
          title={`${index + 1} / ${questions.length}`}
          subtitle={`${(elapsed / 1000).toFixed(1)}s`}
          back={false}
          right={
            <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold tabular-nums text-primary">
              {(elapsed / 1000).toFixed(1)}s
            </span>
          }
        />
        <div className="flex flex-col px-4 pt-3">
          <div className="flex gap-1 pb-6" aria-hidden="true">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border",
                )}
              />
            ))}
          </div>

          <div className="mb-8 flex min-h-40 items-center justify-center rounded-3xl border border-border bg-card px-4 shadow-sm">
            <KanaGlyph
              text={q.prompt}
              jp={q.promptJp}
              className={cn(
                q.promptJp ? "text-6xl" : "text-center text-3xl leading-snug",
                content === "practical" && q.promptJp && "text-5xl",
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((o) => {
              const isPicked = picked === o.id
              const isCorrect = o.id === q.correctId
              const reveal = picked !== null
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={reveal}
                  onClick={() => handlePick(o.id)}
                  className={cn(
                    "flex min-h-20 items-center justify-center rounded-2xl border px-3 py-5 text-center transition-all active:scale-[0.97]",
                    "border-border bg-card",
                    reveal && isCorrect && "border-success bg-success/15 text-success",
                    reveal && isPicked && !isCorrect && "border-destructive bg-destructive/12 text-destructive",
                    !reveal && "hover:border-primary/50",
                  )}
                >
                  <KanaGlyph
                    text={o.label}
                    jp={o.jp}
                    className={o.jp ? "text-4xl" : "text-base font-medium leading-snug"}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // Config
  const dirOptions =
    content === "practical"
      ? [
          { value: "reverse" as DirMode, label: "Japanese → Meaning" },
          { value: "forward" as DirMode, label: "Meaning → Japanese" },
        ]
      : [
          { value: "reverse" as DirMode, label: "Kana → Sound" },
          { value: "forward" as DirMode, label: "Sound → Kana" },
        ]

  return (
    <>
      <ScreenHeader title="Speed round" subtitle="Beat the clock" />
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Zap className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            Tap the correct answer as fast as you can. Your best time for each length is saved.
          </p>
        </div>

        <Segment
          label="Content"
          value={content}
          onChange={setContent}
          options={[
            { value: "kana", label: "Kana" },
            { value: "practical", label: "Practical" },
          ]}
        />

        {content === "kana" && (
          <Segment
            label="Characters"
            value={scope}
            onChange={setScope}
            options={[
              { value: "hiragana", label: "Hiragana" },
              { value: "katakana", label: "Katakana" },
              { value: "both", label: "Both" },
            ]}
          />
        )}
        <Segment label="Direction" value={dir} onChange={setDir} options={dirOptions} />
        <div>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Length
          </p>
          <div className="flex gap-1.5 rounded-2xl border border-border bg-card p-1.5">
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2 text-sm font-semibold tabular-nums transition-colors",
                  count === c
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {pool.length < 4 ? (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            {content === "practical"
              ? "Unlock a practical lesson first. "
              : "Learn at least a few kana first. "}
            <Link href={content === "practical" ? "/practical" : "/"} className="font-medium text-primary">
              {content === "practical" ? "Open practical" : "Start learning"}
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Start · {count} cards
          </button>
        )}
      </div>
    </>
  )
}

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-1.5 rounded-2xl border border-border bg-card p-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
