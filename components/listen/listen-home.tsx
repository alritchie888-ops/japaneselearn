"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronRight, Ear, Lock } from "lucide-react"
import { useProgress } from "@/lib/store/progress"
import { categoryStatus, LISTEN_CATEGORIES } from "@/lib/audio/track"
import { ScreenHeader } from "@/components/screen-header"
import { cn } from "@/lib/utils"

export function ListenHome() {
  const { state, hydrated } = useProgress()

  const rows = useMemo(
    () =>
      LISTEN_CATEGORIES.map((c) => ({
        meta: c,
        status: hydrated
          ? categoryStatus(c.key, state)
          : { available: false, count: 0, mastery: 0 },
      })),
    [hydrated, state],
  )

  if (!hydrated) {
    return (
      <>
        <ScreenHeader title="Listen" />
        <div className="space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="Listen" subtitle="Train your ear — sound to script" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-accent/60 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Ear className="size-5" aria-hidden="true" />
          </span>
          <p className="text-pretty text-sm text-muted-foreground">
            Hear a Japanese sound and pick the character or word it matches. A separate skill from
            reading — mastered independently.
          </p>
        </div>

        {rows.map(({ meta, status }) => {
          const pct = Math.round(status.mastery * 100)
          const locked = !status.available
          const inner = (
            <div
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4 transition-colors",
                locked
                  ? "border-border bg-card/60"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary font-jp text-lg text-foreground">
                {locked ? (
                  <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  meta.jp.slice(0, 2)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{meta.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {locked ? "Locked — learn more first" : meta.blurb}
                </p>
                {!locked && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                )}
              </div>
              {!locked && (
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          )

          return locked ? (
            <div key={meta.key} aria-disabled="true">
              {inner}
            </div>
          ) : (
            <Link key={meta.key} href={`/listen/${meta.key}`} className="block">
              {inner}
            </Link>
          )
        })}
      </div>
    </>
  )
}
