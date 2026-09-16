"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Loader2, Star, Volume2, X } from "lucide-react"
import { speak } from "@/lib/audio/speak"
import { audioHint, audioItemKey, audioKanaKey, replayLimit, type ListenMode } from "@/lib/audio/mastery"
import type { AudioQuestion } from "@/lib/audio/questions"
import { cn } from "@/lib/utils"

export interface AudioResult {
  statKey: string
  /** Credit toward listening mastery (first try, at most one replay). */
  correct: boolean
  firstTry: boolean
  replays: number
  responseMs: number
  /** Audio stat key of the first wrong pick, for confusion training. */
  confusedWith?: string
}

interface AudioChoiceProps {
  question: AudioQuestion
  mode: ListenMode
  /** Current listening mastery of this item, drives fading support. */
  mastery: number
  index: number
  total: number
  onComplete: (result: AudioResult) => void
}

/**
 * One "hear it, pick it" question: a big replay control and a grid of Japanese
 * forms. The learner must map sound → script, with romaji/star aids that fade
 * as mastery grows and disappear entirely in speed mode.
 */
export function AudioChoice({ question, mode, mastery, index, total, onComplete }: AudioChoiceProps) {
  const [replays, setReplays] = useState(0)
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const startRef = useRef(0)
  const firstTryRef = useRef(true)
  const confusedRef = useRef<string | undefined>(undefined)
  const doneRef = useRef(false)

  const hint = audioHint(mode, mastery, question.irregular)
  const limit = replayLimit(mode)
  const canReplay = limit === -1 || replays < limit

  const play = useCallback(async () => {
    setBusy(true)
    await speak(question.audioText)
    setBusy(false)
  }, [question.audioText])

  useEffect(() => {
    startRef.current = performance.now()
    void play()
  }, [play])

  const keyOf = (id: string) => (question.kind === "kana" ? audioKanaKey(id) : audioItemKey(id))

  const finish = (credit: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    onComplete({
      statKey: question.statKey,
      correct: credit,
      firstTry: firstTryRef.current,
      replays,
      responseMs: Math.round(performance.now() - startRef.current),
      confusedWith: confusedRef.current,
    })
  }

  const choose = (id: string) => {
    if (doneRef.current || picked) return
    if (id === question.answerId) {
      setPicked(id)
      const credit = firstTryRef.current && replays <= 1
      void speak(question.audioText)
      window.setTimeout(() => finish(credit), 520)
      return
    }
    if (firstTryRef.current) {
      firstTryRef.current = false
      confusedRef.current = keyOf(id)
    }
    setWrong((w) => new Set(w).add(id))
    if (mode === "speed") window.setTimeout(() => finish(false), 260)
  }

  const replay = () => {
    if (!canReplay || busy) return
    setReplays((r) => r + 1)
    void play()
  }

  const tileText = question.kind === "kana" ? "text-4xl" : "text-2xl"

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {index + 1} <span className="text-muted-foreground/50">/ {total}</span>
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={replay}
          disabled={!canReplay && !busy}
          aria-label="Play sound again"
          className={cn(
            "flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95",
            !canReplay && "opacity-60",
          )}
        >
          {busy ? (
            <Loader2 className="size-9 animate-spin" aria-hidden="true" />
          ) : (
            <Volume2 className="size-9" aria-hidden="true" />
          )}
        </button>
        <div className="flex min-h-5 items-center gap-2">
          {hint.showRomaji && (
            <span className="font-mono text-sm text-muted-foreground">{question.romaji}</span>
          )}
          {hint.star > 0 && (
            <Star
              className={cn("size-4", hint.star === 2 ? "fill-primary text-primary" : "text-primary/70")}
              aria-label="Irregular reading"
            />
          )}
          {limit === -1 && (
            <span className="text-xs text-muted-foreground/70">tap to replay</span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid w-full gap-3",
          question.choices.length <= 4 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {question.choices.map((c) => {
          const isWrong = wrong.has(c.id)
          const isPicked = picked === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              disabled={isWrong || !!picked}
              className={cn(
                "relative flex min-h-20 items-center justify-center rounded-2xl border bg-card px-3 py-4 font-jp leading-tight text-foreground transition-all",
                tileText,
                isPicked && "border-success bg-success/15 text-success",
                isWrong && "border-destructive/40 bg-destructive/5 text-muted-foreground opacity-60",
                !isPicked && !isWrong && "border-border hover:border-primary/50 active:scale-[0.98]",
              )}
            >
              <span className="text-balance text-center">{c.label}</span>
              {isPicked && (
                <Check className="absolute right-2 top-2 size-4 text-success" aria-hidden="true" />
              )}
              {isWrong && (
                <X className="absolute right-2 top-2 size-4 text-destructive/70" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
