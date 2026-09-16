"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Check, Flame, Lock } from "lucide-react"
import { UNITS, getKana } from "@/lib/kana/data"
import { unitTargetKana } from "@/lib/kana/curriculum"
import { isKanaMastered, unitStatus } from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import type { Script } from "@/lib/kana/types"
import { ProgressRing } from "@/components/progress-ring"
import { cn } from "@/lib/utils"

const SCRIPTS: { key: Script; title: string; sample: string }[] = [
  { key: "hiragana", title: "Hiragana", sample: "あ" },
  { key: "katakana", title: "Katakana", sample: "ア" },
]

export function UnitList() {
  const { state, hydrated } = useProgress()
  const stats = state.stats

  const summary = useMemo(() => {
    let total = 0
    let mastered = 0
    for (const u of UNITS) {
      const targets = unitTargetKana(u)
      total += targets.length
      mastered += targets.filter((id) => isKanaMastered(stats[id])).length
    }
    return { total, mastered, pct: total ? mastered / total : 0 }
  }, [stats])

  const continueUnit = useMemo(() => {
    const learning = UNITS.find((u) => unitStatus(u.id, stats) === "learning")
    return learning ?? UNITS[0]
  }, [stats])

  if (!hydrated) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-28 animate-pulse rounded-3xl bg-muted" />
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Hero / overview */}
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your progress
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {summary.mastered}
              <span className="text-lg font-medium text-muted-foreground">/{summary.total}</span>
            </p>
            <p className="text-xs text-muted-foreground">kana mastered</p>
          </div>
          <ProgressRing value={summary.pct} size={72} strokeWidth={7}>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {Math.round(summary.pct * 100)}%
            </span>
          </ProgressRing>
        </div>
        {state.streak.count > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Flame className="size-3.5" aria-hidden="true" />
            {state.streak.count} day streak
          </div>
        )}
        <Link
          href={`/learn/${continueUnit.id}`}
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Continue with {continueUnit.label}
        </Link>
      </section>

      {SCRIPTS.map((script) => (
        <section key={script.key} className="mb-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="font-jp text-xl text-foreground">{script.sample}</span>
            <h2 className="text-sm font-semibold text-foreground">{script.title}</h2>
          </div>
          <ul className="space-y-2.5">
            {UNITS.filter((u) => u.script === script.key).map((unit) => {
              const targets = unitTargetKana(unit)
              const masteredCount = targets.filter((id) => isKanaMastered(stats[id])).length
              const status = unitStatus(unit.id, stats)
              const pct = targets.length ? masteredCount / targets.length : 0
              const locked = status === "locked"

              const body = (
                <div
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl border p-3.5 transition-colors",
                    locked
                      ? "border-border bg-muted/40"
                      : "border-border bg-card shadow-sm hover:border-primary/40",
                  )}
                >
                  <ProgressRing
                    value={pct}
                    size={44}
                    strokeWidth={4}
                    className={status === "mastered" ? "text-success" : "text-primary"}
                  >
                    {status === "mastered" ? (
                      <Check className="size-4 text-success" strokeWidth={3} aria-hidden="true" />
                    ) : locked ? (
                      <Lock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <span className="font-jp text-sm text-foreground">
                        {getKana(unit.base[0]).char}
                      </span>
                    )}
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        locked ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {unit.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {locked
                        ? "Master the previous row to unlock"
                        : `${masteredCount}/${targets.length} mastered`}
                    </p>
                  </div>
                  {status === "mastered" && (
                    <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                      Done
                    </span>
                  )}
                </div>
              )

              return (
                <li key={unit.id}>
                  {locked ? (
                    <div aria-disabled className="cursor-not-allowed opacity-70">
                      {body}
                    </div>
                  ) : (
                    <Link href={`/learn/${unit.id}`} className="block">
                      {body}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
