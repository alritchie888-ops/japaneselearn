"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, GraduationCap, Sparkles } from "lucide-react"
import { PRACTICAL_MODULES, PRACTICAL_MODULES_BY_ID } from "@/lib/practical/data"
import { moduleReadiness, lockReason } from "@/lib/practical/dependency"
import { isItemMastered, type PracticalDirection, type Support } from "@/lib/practical/mastery"
import { shuffle } from "@/lib/kana/selection"
import { useProgress } from "@/lib/store/progress"
import { PracticalMatch } from "./practical-match"
import type { RoundResult } from "@/components/match/kana-match"
import { ScreenHeader } from "@/components/screen-header"
import { ResultCard } from "@/components/session/result-card"

const ROUND_SIZE = 5

interface PStage {
  id: string
  title: string
  subtitle: string
  direction: PracticalDirection
  support: Support
}

/**
 * Staged practical lesson: recognise with full support, recall with reduced
 * support, then a mixed pass on the app's default fade. Support stepping down
 * across stages is how romaji and stars fade within a single lesson.
 */
function buildStages(): PStage[] {
  return [
    {
      id: "learn",
      title: "Learn",
      subtitle: "Read the form and match its meaning.",
      direction: "forward",
      support: "full",
    },
    {
      id: "recall",
      title: "Recall",
      subtitle: "Now produce the written form from its meaning.",
      direction: "reverse",
      support: "reduced",
    },
    {
      id: "mixed",
      title: "Mixed",
      subtitle: "Both directions, with the aids pulling back.",
      direction: "forward",
      support: "auto",
    },
  ]
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

type Phase = "playing" | "stageDone" | "moduleDone"

export function PracticalRunner({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { state, hydrated, completeStage, completeSession } = useProgress()

  const mod = PRACTICAL_MODULES_BY_ID[moduleId]
  const stages = useMemo(() => buildStages(), [])

  const [stageIndex, setStageIndex] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [rounds, setRounds] = useState<string[][]>([])
  const [phase, setPhase] = useState<Phase>("playing")
  const [stageWrong, setStageWrong] = useState(0)
  const [stageTotal, setStageTotal] = useState(0)
  const [sessionCounted, setSessionCounted] = useState(false)

  const stage = stages[stageIndex]

  // Build rounds when a stage begins. Mixed stage shuffles direction per item
  // by alternating; here we simply shuffle the item order.
  useEffect(() => {
    if (!mod || !stage) return
    const ids = shuffle(mod.itemIds)
    setRounds(chunk(ids, ROUND_SIZE))
    setRoundIndex(0)
    setStageWrong(0)
    setStageTotal(ids.length)
    setPhase("playing")
  }, [stageIndex, mod, stage])

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
    if (stage) completeStage(`p:${moduleId}:${stage.id}`)
    if (stageIndex < stages.length - 1) {
      setStageIndex((s) => s + 1)
    } else {
      if (!sessionCounted) {
        completeSession()
        setSessionCounted(true)
      }
      setPhase("moduleDone")
    }
  }, [stage, moduleId, stageIndex, stages.length, completeStage, completeSession, sessionCounted])

  if (!hydrated) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }

  if (!mod) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">That lesson doesn&apos;t exist.</p>
        <Link href="/practical" className="mt-3 inline-block text-sm font-medium text-primary">
          Back to practical
        </Link>
      </div>
    )
  }

  const readiness = moduleReadiness(moduleId, state.stats)
  if (readiness.state === "locked") {
    return (
      <>
        <ScreenHeader title={mod.title} back="/practical" />
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground text-balance">
            You need a few more kana before this lesson. {lockReason(moduleId, state.stats)}.
          </p>
          <Link href="/practical" className="mt-4 inline-block text-sm font-medium text-primary">
            Back to practical
          </Link>
        </div>
      </>
    )
  }

  const accuracy =
    stageTotal + stageWrong > 0
      ? Math.round((stageTotal / (stageTotal + stageWrong)) * 100)
      : 100

  if (phase === "moduleDone") {
    const masteredCount = mod.itemIds.filter((id) => isItemMastered(id, state.stats)).length
    const nextIdx = PRACTICAL_MODULES.findIndex((m) => m.id === moduleId) + 1
    const nextMod = PRACTICAL_MODULES[nextIdx]
    const nextUnlocked = nextMod && moduleReadiness(nextMod.id, state.stats).state !== "locked"
    return (
      <>
        <ScreenHeader title={mod.title} back="/practical" />
        <ResultCard
          tone="success"
          icon={<GraduationCap className="size-9" aria-hidden="true" />}
          title="Lesson complete!"
          subtitle={`You've got ${masteredCount} of ${mod.itemIds.length} solid. Come back to lock in the rest.`}
        >
          {nextMod && nextUnlocked ? (
            <button
              type="button"
              onClick={() => {
                setStageIndex(0)
                setSessionCounted(false)
                router.push(`/practical/${nextMod.id}`)
              }}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              Continue to {nextMod.title}
            </button>
          ) : null}
          <Link
            href="/practical"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Back to practical
          </Link>
        </ResultCard>
      </>
    )
  }

  if (phase === "stageDone" && stage) {
    return (
      <>
        <PracticalProgress title={mod.title} stageIndex={stageIndex} total={stages.length} />
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
            {stageIndex < stages.length - 1 ? "Next stage" : "Finish lesson"}
          </button>
        </ResultCard>
      </>
    )
  }

  const currentRound = rounds[roundIndex] ?? []
  return (
    <>
      <PracticalProgress title={mod.title} stageIndex={stageIndex} total={stages.length} />
      <div className="px-4 pt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">{stage?.title}</h2>
          <span className="text-xs text-muted-foreground">
            {rounds.length > 1 ? `Set ${roundIndex + 1} of ${rounds.length}` : mod.jpTitle}
          </span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground text-pretty">{stage?.subtitle}</p>

        {currentRound.length > 0 && stage && (
          <PracticalMatch
            key={`${stage.id}-${roundIndex}`}
            itemIds={currentRound}
            direction={stage.direction}
            support={stage.support}
            onFinish={handleRoundFinish}
          />
        )}
      </div>
    </>
  )
}

function PracticalProgress({
  title,
  stageIndex,
  total,
}: {
  title: string
  stageIndex: number
  total: number
}) {
  return (
    <>
      <ScreenHeader title={title} subtitle={`Stage ${stageIndex + 1} of ${total}`} back="/practical" />
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
