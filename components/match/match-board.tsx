"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { shuffle } from "@/lib/kana/selection"
import { KanaGlyph } from "@/components/kana-glyph"
import { GoldStar } from "@/components/practical/gold-star"

export interface MatchPair {
  /** Identity used for matching. */
  id: string
  prompt: string
  answer: string
  promptJp?: boolean
  answerJp?: boolean
  /** Optional romaji / helper line shown under the prompt glyph. */
  promptSub?: string
  /** Optional romaji / helper line shown under the answer glyph. */
  answerSub?: string
  /** Gold-star prominence (0–2) for an irregular reading. */
  star?: number
  /** Which side the star/reading attaches to. Defaults to the Japanese side. */
  starSide?: "prompt" | "answer"
}

interface MatchBoardProps {
  pairs: MatchPair[]
  onResult: (id: string, correct: boolean, confusedWith?: string) => void
  onComplete: () => void
}

interface DragSession {
  id: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export function MatchBoard({ pairs, onResult, onComplete }: MatchBoardProps) {
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [wrongId, setWrongId] = useState<string | null>(null)

  const sessionRef = useRef<DragSession | null>(null)
  const targetRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const completedRef = useRef(false)

  // Shuffle the answer targets once per set of pairs.
  const targets = useMemo(() => shuffle(pairs), [pairs])

  // Reset when a new round begins.
  useEffect(() => {
    setMatched(new Set())
    setDragId(null)
    setHoverId(null)
    setWrongId(null)
    completedRef.current = false
  }, [pairs])

  const findTargetUnder = useCallback((x: number, y: number): string | null => {
    for (const [id, el] of targetRefs.current) {
      if (matched.has(id)) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id
    }
    return null
  }, [matched])

  const endDrag = useCallback(
    (x: number, y: number) => {
      const session = sessionRef.current
      sessionRef.current = null
      document.body.classList.remove("dragging-active")
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setDragId(null)
      setHoverId(null)
      if (!session) return

      const over = findTargetUnder(x, y)
      if (over === session.id) {
        setMatched((prev) => {
          const next = new Set(prev)
          next.add(session.id)
          return next
        })
        onResult(session.id, true)
      } else if (over) {
        onResult(session.id, false, over)
        setWrongId(session.id)
        window.setTimeout(() => setWrongId((w) => (w === session.id ? null : w)), 420)
      }
      // If not over any target, silently return the item (no penalty).
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [findTargetUnder, onResult],
  )

  const onMove = useCallback((e: PointerEvent) => {
    if (!sessionRef.current) return
    e.preventDefault()
    setDragPos({ x: e.clientX, y: e.clientY })
    setHoverId(findTargetUnder(e.clientX, e.clientY))
  }, [findTargetUnder])

  const onUp = useCallback((e: PointerEvent) => {
    endDrag(e.clientX, e.clientY)
  }, [endDrag])

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
      if (matched.has(id)) return
      const rect = e.currentTarget.getBoundingClientRect()
      sessionRef.current = {
        id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      }
      setDragId(id)
      setDragPos({ x: e.clientX, y: e.clientY })
      document.body.classList.add("dragging-active")
      window.addEventListener("pointermove", onMove, { passive: false })
      window.addEventListener("pointerup", onUp)
    },
    [matched, onMove, onUp],
  )

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.classList.remove("dragging-active")
    }
  }, [onMove, onUp])

  // Fire completion once every pair is matched.
  useEffect(() => {
    if (!completedRef.current && pairs.length > 0 && matched.size === pairs.length) {
      completedRef.current = true
      const t = window.setTimeout(onComplete, 450)
      return () => window.clearTimeout(t)
    }
  }, [matched, pairs.length, onComplete])

  const session = sessionRef.current

  return (
    <div className="relative select-none">
      <div className="grid grid-cols-2 gap-3">
        {/* Prompts (draggable) */}
        <ul className="flex flex-col gap-3" aria-label="Sounds to match">
          {pairs.map((p) => {
            const isMatched = matched.has(p.id)
            const isDragging = dragId === p.id
            const isWrong = wrongId === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={isMatched}
                  onPointerDown={(e) => startDrag(e, p.id)}
                  className={cn(
                    "relative flex min-h-[5.5rem] w-full touch-none flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-4 font-medium transition-all",
                    "border-border bg-card shadow-sm active:scale-[0.98]",
                    !isMatched && "cursor-grab",
                    isMatched &&
                      "border-transparent bg-muted text-muted-foreground opacity-45",
                    isDragging && "opacity-30",
                    isWrong && "animate-[shake_0.4s] border-destructive text-destructive",
                  )}
                  aria-label={p.promptJp ? `Kana ${p.prompt}` : `Sound ${p.prompt}`}
                >
                  {(p.star ?? 0) > 0 && (p.starSide ?? (p.promptJp ? "prompt" : "answer")) === "prompt" && (
                    <span className="absolute left-2 top-2">
                      <GoldStar level={p.star ?? 0} />
                    </span>
                  )}
                  <KanaGlyph text={p.prompt} jp={p.promptJp} className={p.promptJp ? "text-4xl" : "text-2xl"} />
                  {p.promptSub && (
                    <span className="text-xs font-normal text-muted-foreground">{p.promptSub}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Targets (drop zones) */}
        <ul className="flex flex-col gap-3" aria-label="Drop targets">
          {targets.map((p) => {
            const isMatched = matched.has(p.id)
            const isHover = hoverId === p.id && dragId !== null
            const isCorrectHover = isHover && dragId === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) targetRefs.current.set(p.id, el)
                    else targetRefs.current.delete(p.id)
                  }}
                  tabIndex={-1}
                  className={cn(
                    "relative flex min-h-[5.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-4 transition-all",
                    "border-dashed border-border bg-secondary/40",
                    isHover && !isCorrectHover && "border-solid border-muted-foreground/60",
                    isCorrectHover && "scale-[1.03] border-solid border-primary bg-accent",
                    isMatched &&
                      "border-solid border-success bg-success/12 text-success-foreground",
                  )}
                >
                  {(p.star ?? 0) > 0 && (p.starSide ?? (p.promptJp ? "prompt" : "answer")) === "answer" && (
                    <span className="absolute left-2 top-2">
                      <GoldStar level={p.star ?? 0} />
                    </span>
                  )}
                  <KanaGlyph
                    text={p.answer}
                    jp={p.answerJp}
                    className={cn(p.answerJp ? "text-4xl" : "text-2xl", isMatched && "opacity-90")}
                  />
                  {p.answerSub && (
                    <span className="text-xs font-normal text-muted-foreground">{p.answerSub}</span>
                  )}
                  {isMatched && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Floating drag clone */}
      {dragId && session && (
        <div
          className="pointer-events-none fixed z-50 flex items-center justify-center rounded-2xl border border-primary bg-card text-2xl font-medium shadow-xl"
          style={{
            left: dragPos.x - session.offsetX,
            top: dragPos.y - session.offsetY,
            width: session.width,
            height: session.height,
          }}
          aria-hidden="true"
        >
          {(() => {
            const p = pairs.find((x) => x.id === dragId)
            if (!p) return null
            return (
              <KanaGlyph text={p.prompt} jp={p.promptJp} className={p.promptJp ? "text-4xl" : "text-2xl"} />
            )
          })()}
        </div>
      )}
    </div>
  )
}
