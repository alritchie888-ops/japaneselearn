"use client"

import { Volume2, VolumeX } from "lucide-react"
import { useProgress } from "@/lib/store/progress"
import { speak } from "@/lib/audio/speak"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: true, label: "On", icon: Volume2, hint: "Play sound on a correct match" },
  { value: false, label: "Off", icon: VolumeX, hint: "Stay silent" },
] as const

export function SoundControl() {
  const { state, setSound } = useProgress()
  const active = state.settings.sound

  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => {
        const selected = active === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => {
              setSound(opt.value)
              if (opt.value) void speak("こんにちは")
            }}
            aria-pressed={selected}
            className={cn(
              "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:bg-secondary",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="size-4" aria-hidden="true" />
              {opt.label}
            </span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </button>
        )
      })}
    </div>
  )
}
