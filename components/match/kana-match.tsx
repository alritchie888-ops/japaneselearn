"use client"

import { useCallback, useMemo, useRef } from "react"
import { getKana } from "@/lib/kana/data"
import { useProgress } from "@/lib/store/progress"
import { MatchBoard, type MatchPair } from "./match-board"

export interface RoundResult {
  correct: number
  wrong: number
}

interface KanaMatchProps {
  kanaIds: string[]
  direction: "forward" | "reverse"
  onFinish: (result: RoundResult) => void
}

/**
 * One drag-and-match round for a set of kana. Forward = sound → kana,
 * reverse = kana → sound. Records each attempt into the mastery store.
 */
export function KanaMatch({ kanaIds, direction, onFinish }: KanaMatchProps) {
  const { state, recordAnswer } = useProgress()
  const tally = useRef<RoundResult>({ correct: 0, wrong: 0 })

  const pairs = useMemo<MatchPair[]>(() => {
    tally.current = { correct: 0, wrong: 0 }
    return kanaIds.map((id) => {
      const k = getKana(id)
      if (direction === "forward") {
        return { id, prompt: k.romaji, answer: k.char, promptJp: false, answerJp: true, audioText: k.char }
      }
      return { id, prompt: k.char, answer: k.romaji, promptJp: true, answerJp: false, audioText: k.char }
    })
  }, [kanaIds, direction])

  const handleResult = useCallback(
    (id: string, correct: boolean, confusedWith?: string) => {
      recordAnswer(id, correct, confusedWith ? { confusedWith } : undefined)
      if (correct) tally.current.correct += 1
      else tally.current.wrong += 1
    },
    [recordAnswer],
  )

  const handleComplete = useCallback(() => {
    onFinish({ ...tally.current })
  }, [onFinish])

  return (
    <MatchBoard
      pairs={pairs}
      onResult={handleResult}
      onComplete={handleComplete}
      sound={state.settings.sound}
    />
  )
}
