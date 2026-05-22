'use client'

import { useState, useEffect } from 'react'
import { DrillCard } from '@/components/drill-card'
import { Button } from '@/components/ui/button'
import type { Word, UserWordProgress } from '@/lib/types'
import type { SessionWord } from '@/lib/session-scheduler'
import type { ScriptLevel } from '@/lib/script-scaffold'
import { calculateNewProgress, type FSRSRating } from '@/lib/fsrs'
import { X } from 'lucide-react'

interface DrillSessionProps {
  sessionWords: SessionWord[]
  scriptLevel: ScriptLevel
  onComplete: (results: DrillResult[]) => void
  onExit: () => void
}

export interface DrillResult {
  wordId: string
  direction: 'en_to_jp' | 'jp_to_en'
  correct: boolean
  overridden: boolean
  newProgress: Partial<UserWordProgress>
}

export function DrillSession({ 
  sessionWords, 
  scriptLevel, 
  onComplete,
  onExit
}: DrillSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<DrillResult[]>([])
  const [correctCount, setCorrectCount] = useState(0)

  const currentWord = sessionWords[currentIndex]
  const progress = (currentIndex / sessionWords.length) * 100
  const isComplete = currentIndex >= sessionWords.length

  useEffect(() => {
    if (isComplete) {
      onComplete(results)
    }
  }, [isComplete, results, onComplete])

  function handleAnswer(correct: boolean, overridden: boolean = false) {
    const word = currentWord
    
    // Calculate FSRS rating
    let rating: FSRSRating
    if (overridden) {
      rating = 'good' // Typo but knew it
    } else if (correct) {
      rating = 'good'
    } else {
      rating = 'again'
    }

    // Calculate new progress
    const existingProgress = word.progress
    const newProgress = calculateNewProgress(existingProgress, rating)

    const result: DrillResult = {
      wordId: word.word.id,
      direction: word.direction,
      correct: correct || overridden,
      overridden,
      newProgress,
    }

    setResults(prev => [...prev, result])
    
    if (correct || overridden) {
      setCorrectCount(prev => prev + 1)
    }

    setCurrentIndex(prev => prev + 1)
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <h2 className="text-2xl font-medium mb-4">Session complete</h2>
        <div className="space-y-2 text-muted-foreground">
          <p>{correctCount} / {sessionWords.length} correct</p>
          <p className="text-sm">
            {Math.round((correctCount / sessionWords.length) * 100)}% accuracy
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Header with progress */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X className="h-5 w-5" />
          <span className="sr-only">Exit</span>
        </Button>
        
        <div className="flex-1 mx-4">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentIndex + 1} / {sessionWords.length}
        </span>
      </div>

      {/* Drill card */}
      <div className="flex-1">
        <DrillCard
          key={`${currentWord.word.id}-${currentWord.direction}`}
          word={currentWord.word}
          direction={currentWord.direction}
          scriptLevel={scriptLevel}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  )
}

interface DrillSessionStatsProps {
  total: number
  correct: number
  newWords: number
  reviewedWords: number
}

export function DrillSessionStats({ 
  total, 
  correct, 
  newWords, 
  reviewedWords 
}: DrillSessionStatsProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="text-center p-4 bg-secondary rounded-lg">
        <p className="text-3xl font-medium tabular-nums">{accuracy}%</p>
        <p className="text-sm text-muted-foreground">Accuracy</p>
      </div>
      <div className="text-center p-4 bg-secondary rounded-lg">
        <p className="text-3xl font-medium tabular-nums">{total}</p>
        <p className="text-sm text-muted-foreground">Practiced</p>
      </div>
      {newWords > 0 && (
        <div className="text-center p-4 bg-secondary rounded-lg">
          <p className="text-3xl font-medium tabular-nums">{newWords}</p>
          <p className="text-sm text-muted-foreground">New words</p>
        </div>
      )}
      {reviewedWords > 0 && (
        <div className="text-center p-4 bg-secondary rounded-lg">
          <p className="text-3xl font-medium tabular-nums">{reviewedWords}</p>
          <p className="text-sm text-muted-foreground">Reviewed</p>
        </div>
      )}
    </div>
  )
}
