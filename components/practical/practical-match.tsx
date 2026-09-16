"use client"

import { useCallback, useMemo, useRef } from "react"
import { getPracticalItem } from "@/lib/practical/data"
import { itemNeedsSupport } from "@/lib/practical/dependency"
import {
  hintFor,
  itemMastery,
  itemStatKey,
  type PracticalDirection,
  type Support,
} from "@/lib/practical/mastery"
import { useProgress } from "@/lib/store/progress"
import { MatchBoard, type MatchPair } from "@/components/match/match-board"
import type { RoundResult } from "@/components/match/kana-match"

interface PracticalMatchProps {
  itemIds: string[]
  direction: PracticalDirection
  /** Stage-driven support level. */
  support: Support
  onFinish: (result: RoundResult) => void
}

/**
 * One drag-and-match round for practical items.
 *  - forward = written form → meaning
 *  - reverse = meaning → written form
 * Reading (romaji) and the gold star are attached to the Japanese side, with
 * prominence decided per item by `hintFor` (romaji setting × mastery × stage).
 * Recognition and recall are stored under separate stat keys.
 */
export function PracticalMatch({ itemIds, direction, support, onFinish }: PracticalMatchProps) {
  const { state, recordAnswer } = useProgress()
  const tally = useRef<RoundResult>({ correct: 0, wrong: 0 })
  const mode = state.settings.romaji

  const pairs = useMemo<MatchPair[]>(() => {
    tally.current = { correct: 0, wrong: 0 }
    return itemIds.flatMap((id): MatchPair[] => {
      const item = getPracticalItem(id)
      if (!item) return []
      const mastery = itemMastery(id, state.stats)
      const needsSupport = itemNeedsSupport(id, state.stats)
      const hint = hintFor(item, { mode, mastery, support, needsSupport })
      const reading = hint.showRomaji ? item.romaji : undefined
      const statId = itemStatKey(id, direction)

      if (direction === "forward") {
        // Japanese written form → English meaning. Star + reading on prompt.
        return [
          {
            id: statId,
            prompt: item.written,
            answer: item.meaning,
            promptJp: true,
            answerJp: false,
            promptSub: reading,
            star: hint.star,
            starSide: "prompt",
            audioText: item.kana,
          },
        ]
      }
      // English meaning → Japanese written form. Star + reading on answer.
      return [
        {
          id: statId,
          prompt: item.meaning,
          answer: item.written,
          promptJp: false,
          answerJp: true,
          answerSub: reading,
          star: hint.star,
          starSide: "answer",
          audioText: item.kana,
        },
      ]
    })
  }, [itemIds, direction, support, mode, state.stats])

  const handleResult = useCallback(
    (statId: string, correct: boolean, confusedWith?: string) => {
      recordAnswer(statId, correct, confusedWith ? { confusedWith } : undefined)
      if (correct) tally.current.correct += 1
      else tally.current.wrong += 1
    },
    [recordAnswer],
  )

  const handleComplete = useCallback(() => onFinish({ ...tally.current }), [onFinish])

  return (
    <MatchBoard
      pairs={pairs}
      onResult={handleResult}
      onComplete={handleComplete}
      sound={state.settings.sound}
    />
  )
}
