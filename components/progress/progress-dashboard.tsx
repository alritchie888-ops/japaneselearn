"use client"

import { useMemo } from "react"
import { Flame, Layers, RotateCcw, Zap } from "lucide-react"
import { UNITS, getKana, unitAllKana } from "@/lib/kana/data"
import {
  isKanaMastered,
  masteryLevel,
  reps,
  recentAccuracy,
} from "@/lib/store/mastery"
import { useProgress } from "@/lib/store/progress"
import type { Script } from "@/lib/kana/types"
import { ScreenHeader } from "@/components/screen-header"
import { cn } from "@/lib/utils"

const LEVEL_CLASS = [
  "bg-secondary text-muted-foreground border-border",
  "bg-accent text-primary border-transparent",
  "bg-primary/30 text-foreground border-transparent",
  "bg-primary/70 text-primary-foreground border-transparent",
  "bg-success text-success-foreground border-transparent",
] as const

const SCRIPTS: { key: Script; title: string }[] = [
  { key: "hiragana", title: "Hiragana" },
  { key: "katakana", title: "Katakana" },
]

export function ProgressDashboard() {
  const { state, hydrated, reset } = useProgress()
  const stats = state.stats

  const overview = useMemo(() => {
    const allIds = UNITS.flatMap((u) => unitAllKana(u))
    const unique = [...new Set(allIds)]
    const mastered = unique.filter((id) => isKanaMastered(stats[id])).length
    const seen = unique.filter((id) => reps(stats[id]) > 0).length
    return { total: unique.length, mastered, seen }
  }, [stats])

  const weak = useMemo(() => {
    return Object.entries(stats)
      .filter(([, s]) => reps(s) >= 2 && recentAccuracy(s) < 0.85)
      .sort((a, b) => recentAccuracy(a[1]) - recentAccuracy(b[1]))
      .slice(0, 8)
      .map(([id, s]) => ({ id, acc: recentAccuracy(s) }))
  }, [stats])

  const bestTimes = useMemo(
    () =>
      Object.entries(state.bestSpeed)
        .map(([count, rec]) => ({ count: Number(count), ...rec }))
        .sort((a, b) => a.count - b.count),
    [state.bestSpeed],
  )

  if (!hydrated) {
    return (
      <>
        <ScreenHeader title="Progress" />
        <div className="space-y-3 p-4">
          <div className="h-24 animate-pulse rounded-3xl bg-muted" />
          <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        </div>
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="Progress" subtitle="Your mastery so far" />
      <div className="space-y-6 p-4">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            icon={<Layers className="size-4" aria-hidden="true" />}
            value={`${overview.mastered}`}
            label="Mastered"
          />
          <StatTile
            icon={<Flame className="size-4" aria-hidden="true" />}
            value={String(state.streak.count)}
            label="Day streak"
          />
          <StatTile
            icon={<Zap className="size-4" aria-hidden="true" />}
            value={String(state.sessionsCompleted)}
            label="Sessions"
          />
        </div>

        {/* Best speed times */}
        {bestTimes.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">Best speed times</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {bestTimes.map((b) => (
                <li key={b.count} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{b.count} cards</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {Math.round(b.accuracy * 100)}% acc
                    </span>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {(b.timeMs / 1000).toFixed(1)}s
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Weak kana */}
        {weak.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-sm font-semibold text-foreground">Needs review</h2>
            <div className="flex flex-wrap gap-2">
              {weak.map((w) => {
                const k = getKana(w.id)
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <span className="font-jp text-xl text-foreground">{k.char}</span>
                    <span className="text-xs text-muted-foreground">
                      {k.romaji} · {Math.round(w.acc * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Mastery map */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground">Mastery map</h2>
            <Legend />
          </div>
          <div className="space-y-5">
            {SCRIPTS.map((script) => (
              <div key={script.key}>
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {script.title}
                </p>
                <div className="space-y-1.5">
                  {UNITS.filter((u) => u.script === script.key).map((unit) => (
                    <div key={unit.id} className="flex flex-wrap gap-1.5">
                      {unitAllKana(unit).map((id) => {
                        const k = getKana(id)
                        const level = masteryLevel(stats[id])
                        return (
                          <div
                            key={id}
                            title={`${k.char} (${k.romaji})`}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-lg border font-jp text-base",
                              LEVEL_CLASS[level],
                            )}
                          >
                            {k.char}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reset */}
        <section className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all progress? This cannot be undone.")) reset()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset progress
          </button>
        </section>
      </div>
    </>
  )
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
        {icon}
      </span>
      <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="text-[10px] text-muted-foreground">less</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className={cn("size-3 rounded-sm border", LEVEL_CLASS[l])} />
      ))}
      <span className="text-[10px] text-muted-foreground">more</span>
    </div>
  )
}
