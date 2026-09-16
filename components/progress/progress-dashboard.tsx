"use client"

import { useMemo } from "react"
import { Ear, Flame, Layers, RotateCcw, Zap } from "lucide-react"
import { UNITS, ALL_KANA, getKana, unitAllKana } from "@/lib/kana/data"
import {
  isKanaMastered,
  masteryLevel,
  masteryScore,
  reps,
  recentAccuracy,
} from "@/lib/store/mastery"
import { ALL_PRACTICAL_ITEMS } from "@/lib/practical/data"
import { itemMastery } from "@/lib/practical/mastery"
import { audioItemKey, audioKanaKey } from "@/lib/audio/mastery"
import { useProgress } from "@/lib/store/progress"
import type { Script } from "@/lib/kana/types"
import type { PracticalCategory } from "@/lib/practical/types"
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

  // Listening is tracked separately from reading, so show them side by side per
  // group — only for groups the learner has actually started.
  const listenGroups = useMemo(() => {
    const groups: { title: string; visual: number; listening: number }[] = []
    const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0)

    for (const s of SCRIPTS) {
      const ids = ALL_KANA.filter((k) => k.script === s.key && reps(stats[k.id]) > 0).map((k) => k.id)
      if (ids.length === 0) continue
      groups.push({
        title: s.title,
        visual: avg(ids.map((id) => masteryScore(stats[id]))),
        listening: avg(ids.map((id) => masteryScore(stats[audioKanaKey(id)]))),
      })
    }

    const cats: { key: PracticalCategory; title: string }[] = [
      { key: "numbers", title: "Numbers" },
      { key: "time", title: "Time" },
      { key: "calendar", title: "Calendar" },
      { key: "counters", title: "Counters" },
    ]
    for (const c of cats) {
      const items = ALL_PRACTICAL_ITEMS.filter((it) => it.category === c.key)
      const seen = items.filter((it) => itemMastery(it.id, stats) > 0)
      if (seen.length === 0) continue
      groups.push({
        title: c.title,
        visual: avg(seen.map((it) => itemMastery(it.id, stats))),
        listening: avg(seen.map((it) => masteryScore(stats[audioItemKey(it.id)]))),
      })
    }
    return groups
  }, [stats])

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

        {/* Reading vs listening */}
        {listenGroups.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <Ear className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">Reading vs listening</h2>
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              {listenGroups.map((g) => (
                <div key={g.title}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{g.title}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      read {Math.round(g.visual * 100)}% · heard {Math.round(g.listening * 100)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <SkillBar value={g.visual} tone="muted" />
                    <SkillBar value={g.listening} tone="primary" />
                  </div>
                </div>
              ))}
            </div>
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

function SkillBar({ value, tone }: { value: number; tone: "primary" | "muted" }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full transition-all", tone === "primary" ? "bg-primary" : "bg-muted-foreground/50")}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
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
