"use client"

import { Check, Loader2, Mic, X } from "lucide-react"
import type { MicState } from "@/lib/speech/use-recognizer"
import type { SpeakGrade } from "@/lib/speech/validation"
import { cn } from "@/lib/utils"

/**
 * The microphone control. Its appearance always makes the current state
 * unmistakable — ready, actively listening (pulsing), processing, or the graded
 * outcome — so the learner is never unsure whether the mic is live.
 */
export function MicButton({
  mic,
  grade,
  disabled,
  onPress,
  onCancel,
}: {
  mic: MicState
  /** Last verdict, shown once processing resolves. */
  grade: SpeakGrade | null
  disabled?: boolean
  onPress: () => void
  onCancel: () => void
}) {
  const listening = mic === "listening"
  const processing = mic === "processing"

  const settled =
    mic === "idle" && grade
      ? grade === "correct"
        ? "correct"
        : grade === "close"
          ? "close"
          : grade === "incorrect"
            ? "incorrect"
            : "unknown"
      : null

  const label = listening
    ? "Listening — tap to stop"
    : processing
      ? "Checking your answer"
      : "Tap and say it"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {listening && (
          <>
            <span className="absolute inline-flex size-28 animate-ping rounded-full bg-primary/30" />
            <span className="absolute inline-flex size-24 animate-pulse rounded-full bg-primary/20" />
          </>
        )}
        <button
          type="button"
          onClick={listening ? onCancel : onPress}
          disabled={disabled || processing}
          aria-label={label}
          className={cn(
            "relative flex size-24 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
            listening && "bg-primary text-primary-foreground shadow-primary/30",
            processing && "bg-secondary text-muted-foreground",
            settled === "correct" && "bg-success text-success-foreground shadow-success/30",
            settled === "incorrect" && "bg-destructive text-destructive-foreground",
            (settled === "close" || settled === "unknown") && "bg-secondary text-foreground",
            !listening && !processing && !settled && "bg-primary text-primary-foreground shadow-primary/25",
            disabled && "opacity-60",
          )}
        >
          {processing ? (
            <Loader2 className="size-9 animate-spin" aria-hidden="true" />
          ) : settled === "correct" ? (
            <Check className="size-10" aria-hidden="true" />
          ) : settled === "incorrect" ? (
            <X className="size-10" aria-hidden="true" />
          ) : (
            <Mic className="size-9" aria-hidden="true" />
          )}
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "min-h-5 text-sm font-medium",
          listening ? "text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  )
}
