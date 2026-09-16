"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronRight, Lock, Mic } from "lucide-react"
import { ScreenHeader } from "@/components/screen-header"
import { useProgress } from "@/lib/store/progress"
import { getSpeechProvider } from "@/lib/speech/recognizer"
import { categoryStatus, SPEAK_CATEGORIES } from "@/lib/speak/track"
import { cn } from "@/lib/utils"

/**
 * Speak home — every production category with its own unlock state and speaking
 * mastery bar. Locked cards explain what unlocks them so the recognition →
 * listening → speaking progression is legible.
 */
export function SpeakHome() {
  const { state, hydrated } = useProgress()
  const micSupported = useMemo(() => getSpeechProvider().supported, [])

  const cards = useMemo(
    () => SPEAK_CATEGORIES.map((meta) => ({ meta, status: categoryStatus(meta.key, state) })),
    [state],
  )

  return (
    <div>
      <ScreenHeader
        title="Speak"
        subtitle="See it, say it — your pronunciation, checked in context"
      />
      <div className="space-y-4 px-4 py-5">
        {!micSupported && (
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Mic className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              Your browser can&apos;t capture speech. Open the app in Chrome or Safari to practice
              speaking aloud.
            </p>
          </div>
        )}

        <div className="grid gap-2.5">
          {cards.map(({ meta, status }) => {
            const locked = !status.available
            const pct = Math.round(status.mastery * 100)
            const body = (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl font-jp text-base",
                      locked ? "bg-secondary text-muted-foreground/60" : "bg-primary/10 text-primary",
                    )}
                    aria-hidden="true"
                  >
                    {locked ? <Lock className="size-4" /> : meta.jp.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      {meta.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {locked ? "Learn & hear more of this first" : meta.blurb}
                    </p>
                  </div>
                  {!locked && <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                </div>
                {!locked && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
                      {pct}% · {status.count}
                    </span>
                  </div>
                )}
              </>
            )

            return locked ? (
              <div
                key={meta.key}
                aria-disabled="true"
                className="rounded-2xl border border-border bg-card/60 px-4 py-3.5 opacity-70"
              >
                {body}
              </div>
            ) : (
              <Link
                key={meta.key}
                href={`/speak/${meta.key}`}
                className="rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
              >
                {body}
              </Link>
            )
          })}
        </div>

        {hydrated && cards.every((c) => !c.status.available) && (
          <p className="text-pretty px-2 text-center text-sm text-muted-foreground">
            Speaking unlocks as you learn and hear the kana. Complete a lesson or two, then come back
            to say them aloud.
          </p>
        )}
      </div>
    </div>
  )
}
