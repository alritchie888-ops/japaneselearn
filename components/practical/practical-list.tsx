"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Check, Lock, Star, Hash, Clock, CalendarDays, Boxes, Timer, Coins, Cake, Layers } from "lucide-react"
import { PRACTICAL_MODULES } from "@/lib/practical/data"
import { moduleReadiness, lockReason } from "@/lib/practical/dependency"
import { isItemMastered } from "@/lib/practical/mastery"
import { useProgress } from "@/lib/store/progress"
import type { PracticalCategory } from "@/lib/practical/types"
import { ProgressRing } from "@/components/progress-ring"
import { cn } from "@/lib/utils"

const CATEGORIES: { key: PracticalCategory; title: string; icon: typeof Hash }[] = [
  { key: "numbers", title: "Numbers", icon: Hash },
  { key: "time", title: "Telling time", icon: Clock },
  { key: "calendar", title: "Days & dates", icon: CalendarDays },
  { key: "counters", title: "Counters", icon: Boxes },
  { key: "duration", title: "Durations", icon: Timer },
  { key: "money", title: "Money", icon: Coins },
  { key: "age", title: "Age", icon: Cake },
  { key: "combos", title: "Real-world combos", icon: Layers },
]

export function PracticalList() {
  const { state, hydrated } = useProgress()
  const stats = state.stats

  const summary = useMemo(() => {
    let total = 0
    let mastered = 0
    for (const m of PRACTICAL_MODULES) {
      total += m.itemIds.length
      mastered += m.itemIds.filter((id) => isItemMastered(id, stats)).length
    }
    return { total, mastered, pct: total ? mastered / total : 0 }
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
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Practical Japanese
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              {summary.mastered}
              <span className="text-lg font-medium text-muted-foreground">/{summary.total}</span>
            </p>
            <p className="text-xs text-muted-foreground">forms learned</p>
          </div>
          <ProgressRing value={summary.pct} size={72} strokeWidth={7}>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {Math.round(summary.pct * 100)}%
            </span>
          </ProgressRing>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground text-pretty">
          <Star className="size-3.5 shrink-0 fill-star text-star" aria-hidden="true" />
          Gold marks an irregular reading. Lessons unlock as you learn the kana they use.
        </p>
      </section>

      {CATEGORIES.map((cat) => {
        const mods = PRACTICAL_MODULES.filter((m) => m.category === cat.key)
        if (mods.length === 0) return null
        const Icon = cat.icon
        return (
          <section key={cat.key} className="mb-6">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">{cat.title}</h2>
            </div>
            <ul className="space-y-2.5">
              {mods.map((m) => {
                const masteredCount = m.itemIds.filter((id) => isItemMastered(id, stats)).length
                const pct = m.itemIds.length ? masteredCount / m.itemIds.length : 0
                const { state: lock } = moduleReadiness(m.id, stats)
                const locked = lock === "locked"
                const done = masteredCount === m.itemIds.length

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
                      className={done ? "text-success" : "text-primary"}
                    >
                      {done ? (
                        <Check className="size-4 text-success" strokeWidth={3} aria-hidden="true" />
                      ) : locked ? (
                        <Lock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <span className="font-jp text-sm text-foreground">
                          {m.itemIds.length}
                        </span>
                      )}
                    </ProgressRing>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            locked ? "text-muted-foreground" : "text-foreground",
                          )}
                        >
                          {m.title}
                        </p>
                        {lock === "supported" && !done && (
                          <span className="shrink-0 rounded-full bg-star/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-star">
                            Assisted
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {locked
                          ? lockReason(m.id, stats)
                          : `${masteredCount}/${m.itemIds.length} · ${m.jpTitle}`}
                      </p>
                    </div>
                    {done && (
                      <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                        Done
                      </span>
                    )}
                  </div>
                )

                return (
                  <li key={m.id}>
                    {locked ? (
                      <div aria-disabled className="cursor-not-allowed opacity-70">
                        {body}
                      </div>
                    ) : (
                      <Link href={`/practical/${m.id}`} className="block">
                        {body}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
