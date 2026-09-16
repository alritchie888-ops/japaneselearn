"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Shuffle, Target } from "lucide-react"
import { UNITS, unitAllKana } from "@/lib/kana/data"
import { unitStatus } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import type { Script } from "@/lib/kana/types"
import { weightedSample } from "@/lib/kana/selection"
import { KanaMatch, type RoundResult } from "@/components/match/kana-match"
import { ScreenHeader } from "@/components/screen-header"
import { ResultCard } from "@/components/session/result-card"
import { cn } from "@/lib/utils"

type ScriptScope = "hiragana" | "katakana" | "both"
type DirMode = "forward" | "reverse" | "mixed"
type Phase = "config" | "playing" | "summary"

const ROUND_SIZE = 5

export function PracticeSession() {
  const { state, hydrated } = useProgress()
  const [scope, setScope] = useState<ScriptScope>("both")
  const [dirMode, setDirMode] = useState<DirMode>("mixed")
  const [phase, setPhase] = useState<Phase>("config")

  const [roundKey, setRoundKey] = useState(0)
  const [roundKana, setRoundKana] = useState<string[]>([])
  const [roundDir, setRoundDir] = useState<"forward" | "reverse">("forward")
  const totals = useRef({ correct: 0, wrong: 0, cards: 0 })

  const pool = useMemo(() => {
    const scripts: Script[] =
      scope === "both" ? ["hiragana", "katakana"] : [scope]
    const ids: string[] = []
    for (const u of UNITS) {
      if (!scripts.includes(u.script)) continue
      if (unitStatus(u.id, state.stats) === "locked") continue
      ids.push(...unitAllKana(u))
    }
    return [...new Set(ids)]
  }, [scope, state.stats])

  const nextRound = useCallback(() => {
    const ids = weightedSample(pool, state.stats, Math.min(ROUND_SIZE, pool.length))
    setRoundKana(ids)
    setRoundDir(dirMode === "mixed" ? (Math.random() < 0.5 ? "forward" : "reverse") : dirMode)
    setRoundKey((k) => k + 1)
  }, [pool, state.stats, dirMode])

  const start = useCallback(() => {
    totals.current = { correct: 0, wrong: 0, cards: 0 }
    setPhase("playing")
    nextRound()
  }, [nextRound])

  const handleFinish = useCallback(
    (r: RoundResult) => {
      totals.current.correct += r.correct
      totals.current.wrong += r.wrong
      totals.current.cards += roundKana.length
      nextRound()
    },
    [nextRound, roundKana.length],
  )

  const stop = useCallback(() => setPhase("summary"), [])

  if (!hydrated) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  if (phase === "summary") {
    const t = totals.current
    const attempts = t.correct + t.wrong
    const acc = attempts > 0 ? Math.round((t.correct / attempts) * 100) : 100
    return (
      <>
        <ScreenHeader title="Practice" back="/practice" />
        <ResultCard
          tone={acc >= 90 ? "success" : "primary"}
          icon={<Target className="size-9" aria-hidden="true" />}
          title="Practice summary"
          subtitle="Keep practicing to strengthen weak kana."
          stats={[
            { label: "Cards", value: String(t.cards) },
            { label: "Accuracy", value: `${acc}%` },
            { label: "Misses", value: String(t.wrong) },
          ]}
        >
          <button
            type="button"
            onClick={start}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Practice again
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
    const t = totals.current
    const attempts = t.correct + t.wrong
    const acc = attempts > 0 ? Math.round((t.correct / attempts) * 100) : 100
    return (
      <>
        <ScreenHeader
          title="Practice"
          subtitle={`${t.cards} cards · ${acc}% accuracy`}
          back={false}
          right={
            <button
              type="button"
              onClick={stop}
              className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground"
            >
              Done
            </button>
          }
        />
        <div className="px-4 pt-5">
          <p className="mb-5 text-sm text-muted-foreground">
            {roundDir === "reverse"
              ? "Drag each character onto its sound."
              : "Drag each sound onto its character."}
          </p>
          {roundKana.length > 0 && (
            <KanaMatch
              key={roundKey}
              kanaIds={roundKana}
              direction={roundDir}
              onFinish={handleFinish}
            />
          )}
        </div>
      </>
    )
  }

  // Config
  return (
    <>
      <ScreenHeader title="Practice" subtitle="Free-form drilling" />
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Shuffle className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            Practice mixes your unlocked kana and focuses on the ones you miss most.
          </p>
        </div>

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

        <Segment
          label="Direction"
          value={dirMode}
          onChange={setDirMode}
          options={[
            { value: "forward", label: "Sound → Kana" },
            { value: "reverse", label: "Kana → Sound" },
            { value: "mixed", label: "Mixed" },
          ]}
        />

        {pool.length === 0 ? (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Nothing to practice yet.{" "}
            <Link href="/" className="font-medium text-primary">
              Start learning
            </Link>{" "}
            first.
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Start practice · {pool.length} kana
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
