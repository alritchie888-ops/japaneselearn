"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, GraduationCap, Sparkles } from "lucide-react"
import { UNITS, UNITS_BY_ID } from "@/lib/kana/data"
import {
  getStages,
  stageOwnKana,
  unitIndex,
  unitTargetKana,
  type Stage,
} from "@/lib/kana/curriculum"
import { weightedSample } from "@/lib/kana/selection"
import { isUnitMastered, unitStatus } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import { KanaMatch, type RoundResult } from "@/components/match/kana-match"
import { ScreenHeader } from "@/components/screen-header"
import { ResultCard } from "@/components/session/result-card"

const ROUND_SIZE = 5

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

type Phase = "playing" | "stageDone" | "unitDone"

export function LessonRunner({ unitId }: { unitId: string }) {
  const router = useRouter()
  const { state, hydrated, completeStage, completeSession, setLastUnit } = useProgress()

  const unit = UNITS_BY_ID[unitId]
  const stages = useMemo(() => (unit ? getStages(unit) : []), [unit])
  const idx = unitIndex(unitId)

  const [stageIndex, setStageIndex] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [rounds, setRounds] = useState<string[][]>([])
  const [phase, setPhase] = useState<Phase>("playing")
  const [stageWrong, setStageWrong] = useState(0)
  const [stageTotal, setStageTotal] = useState(0)
  const [sessionCounted, setSessionCounted] = useState(false)

  const stage: Stage | undefined = stages[stageIndex]

  useEffect(() => {
    setLastUnit(unitId)
  }, [unitId, setLastUnit])

  // Build the rounds for the active stage (once per stage entry).
  useEffect(() => {
    if (!unit || !stage) return
    const stats = state.stats
    let pool = [...stageOwnKana(stage, unit)]

    if (stage.kind === "review" && idx > 0) {
      const prev = UNITS.slice(0, idx).flatMap((u) => unitTargetKana(u))
      const attempted = prev.filter((id) => (stats[id]?.correct ?? 0) + (stats[id]?.incorrect ?? 0) > 0)
      const source = attempted.length > 0 ? attempted : prev
      const extras = weightedSample(source, stats, Math.min(4, source.length))
      pool = [...new Set([...pool, ...extras])]
    }

    const ordered = weightedSample(pool, stats, pool.length)
    setRounds(chunk(ordered, ROUND_SIZE))
    setRoundIndex(0)
    setStageWrong(0)
    setStageTotal(pool.length)
    setPhase("playing")
    // We intentionally snapshot stats at stage entry; do not re-run on every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex, unit, stage, idx])

  const handleRoundFinish = useCallback(
    (result: RoundResult) => {
      setStageWrong((w) => w + result.wrong)
      setRoundIndex((r) => {
        if (r < rounds.length - 1) return r + 1
        setPhase("stageDone")
        return r
      })
    },
    [rounds.length],
  )

  const handleStageContinue = useCallback(() => {
    if (stage) completeStage(stage.id)
    if (stageIndex < stages.length - 1) {
      setStageIndex((s) => s + 1)
    } else {
      if (!sessionCounted) {
        completeSession()
        setSessionCounted(true)
      }
      setPhase("unitDone")
    }
  }, [stage, stageIndex, stages.length, completeStage, completeSession, sessionCounted])

  if (!hydrated) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  if (!unit) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">That lesson doesn&apos;t exist.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-primary">
          Back to lessons
        </Link>
      </div>
    )
  }

  if (unitStatus(unit.id, state.stats) === "locked") {
    return (
      <>
        <ScreenHeader title={unit.label} back="/" />
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Master the previous row before starting {unit.label}.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary">
            Back to lessons
          </Link>
        </div>
      </>
    )
  }

  const accuracy =
    stageTotal + stageWrong > 0
      ? Math.round((stageTotal / (stageTotal + stageWrong)) * 100)
      : 100

  // Unit complete screen
  if (phase === "unitDone") {
    const mastered = isUnitMastered(unit.id, state.stats)
    const nextUnit = idx >= 0 ? UNITS[idx + 1] : undefined
    const nextUnlocked = nextUnit && unitStatus(nextUnit.id, state.stats) !== "locked"
    return (
      <>
        <ScreenHeader title={unit.label} back="/" />
        <ResultCard
          tone="success"
          icon={<GraduationCap className="size-9" aria-hidden="true" />}
          title="Row complete!"
          subtitle={
            mastered
              ? "You've mastered this row. Keep the streak going."
              : "Nice work. Review it again later to lock it in."
          }
        >
          {nextUnit && nextUnlocked ? (
            <button
              type="button"
              onClick={() => {
                setStageIndex(0)
                setSessionCounted(false)
                router.push(`/learn/${nextUnit.id}`)
              }}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              Continue to {nextUnit.label}
            </button>
          ) : null}
          <Link
            href="/"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Back to lessons
          </Link>
        </ResultCard>
      </>
    )
  }

  // Stage complete screen
  if (phase === "stageDone" && stage) {
    return (
      <>
        <LessonProgress unit={unit.label} stageIndex={stageIndex} total={stages.length} />
        <ResultCard
          tone={stageWrong === 0 ? "success" : "primary"}
          icon={
            stageWrong === 0 ? (
              <Sparkles className="size-9" aria-hidden="true" />
            ) : (
              <Check className="size-9" aria-hidden="true" />
            )
          }
          title={stageWrong === 0 ? "Perfect round!" : `${stage.title} cleared`}
          subtitle={stage.subtitle}
          stats={[
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Cards", value: String(stageTotal) },
            { label: "Misses", value: String(stageWrong) },
          ]}
        >
          <button
            type="button"
            onClick={handleStageContinue}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            {stageIndex < stages.length - 1 ? "Next stage" : "Finish row"}
          </button>
        </ResultCard>
      </>
    )
  }

  // Playing
  const currentRound = rounds[roundIndex] ?? []
  return (
    <>
      <LessonProgress unit={unit.label} stageIndex={stageIndex} total={stages.length} />
      <div className="px-4 pt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">{stage?.title}</h2>
          <span className="text-xs text-muted-foreground">
            {rounds.length > 1 ? `Set ${roundIndex + 1} of ${rounds.length}` : stage?.subtitle}
          </span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          {stage?.direction === "reverse"
            ? "Drag each character onto its sound."
            : "Drag each sound onto its character."}
        </p>

        {currentRound.length > 0 && stage && (
          <KanaMatch
            key={`${stage.id}-${roundIndex}`}
            kanaIds={currentRound}
            direction={stage.direction}
            onFinish={handleRoundFinish}
          />
        )}
      </div>
    </>
  )
}

function LessonProgress({
  unit,
  stageIndex,
  total,
}: {
  unit: string
  stageIndex: number
  total: number
}) {
  return (
    <>
      <ScreenHeader title={unit} subtitle={`Stage ${stageIndex + 1} of ${total}`} back="/" />
      <div className="flex gap-1.5 px-4 pt-3" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < stageIndex ? "bg-primary" : i === stageIndex ? "bg-primary/50" : "bg-border"
            }`}
          />
        ))}
      </div>
    </>
  )
}
