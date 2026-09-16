"use client"

import { useCallback, useState } from "react"
import { Loader2, Volume2 } from "lucide-react"
import { speak } from "@/lib/audio/speak"
import { cn } from "@/lib/utils"

interface SpeakButtonProps {
  /** Japanese text to pronounce. */
  text: string
  className?: string
  /** Accessible label; defaults to a generic play-sound label. */
  label?: string
}

/**
 * Tap-to-hear control. Rendered as a role="button" span so it can live inside
 * the draggable match tiles (which are themselves <button>s) without nesting
 * interactive elements, and it stops pointer/click events from starting a drag.
 */
export function SpeakButton({ text, className, label }: SpeakButtonProps) {
  const [busy, setBusy] = useState(false)

  const play = useCallback(async () => {
    if (busy) return
    setBusy(true)
    await speak(text)
    setBusy(false)
  }, [busy, text])

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label ?? `Play pronunciation${text ? ` of ${text}` : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        void play()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          void play()
        }
      }}
      className={cn(
        "inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Volume2 className="size-3.5" aria-hidden="true" />
      )}
    </span>
  )
}
