"use client"

import { useProgress } from "@/lib/store/progress"
import type { RomajiMode } from "@/lib/practical/types"
import { cn } from "@/lib/utils"

const OPTIONS: { value: RomajiMode; label: string; hint: string }[] = [
  { value: "on", label: "Always", hint: "Romaji shown on every card." },
  { value: "fade", label: "Fade out", hint: "Romaji disappears as you master each item." },
  { value: "off", label: "Off", hint: "Kana only, except where a kana is still shaky." },
]

export function RomajiControl() {
  const { state, hydrated, setRomajiMode } = useProgress()
  const mode = state.settings.romaji
  const active = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[1]

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Romaji reading aid"
        className="flex gap-1 rounded-2xl border border-border bg-secondary/40 p-1"
      >
        {OPTIONS.map((o) => {
          const selected = o.value === mode
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!hydrated}
              onClick={() => setRomajiMode(o.value)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 px-1 text-xs text-muted-foreground text-pretty">{active.hint}</p>
    </div>
  )
}
