'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JapaneseText, MeaningDisplay } from '@/components/japanese-text'
import type { Word } from '@/lib/types'
import type { ScriptLevel } from '@/lib/script-scaffold'
import { Check, X } from 'lucide-react'

interface DrillCardProps {
  word: Word
  direction: 'en_to_jp' | 'jp_to_en'
  scriptLevel: ScriptLevel
  onAnswer: (correct: boolean, overridden?: boolean) => void
}

/**
 * Fast drill card - spreadsheet-fast, no friction
 * Shows prompt, accepts typed answer, instant feedback
 */
export function DrillCard({ word, direction, scriptLevel, onAnswer }: DrillCardProps) {
  const [answer, setAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [word.id, direction])

  // Get acceptable answers based on direction
  const getAcceptableAnswers = useCallback((): string[] => {
    if (direction === 'en_to_jp') {
      // User sees English, must produce Japanese
      const answers: string[] = []
      if (scriptLevel === 'romaji') {
        answers.push(word.romaji.toLowerCase())
      } else {
        answers.push(word.hiragana)
        if (word.katakana) answers.push(word.katakana)
        if (word.kanji && scriptLevel !== 'hiragana') answers.push(word.kanji)
        // Also accept romaji as fallback
        answers.push(word.romaji.toLowerCase())
      }
      return answers
    } else {
      // User sees Japanese, must produce English
      const answers = [word.meaning_en.toLowerCase()]
      if (word.meaning_en_alt) {
        answers.push(...word.meaning_en_alt.map(a => a.toLowerCase()))
      }
      return answers
    }
  }, [direction, scriptLevel, word])

  // Check if answer is correct (forgiving matching)
  const checkAnswer = useCallback((input: string): boolean => {
    const normalized = input.trim().toLowerCase()
    const acceptable = getAcceptableAnswers()
    
    // Exact match
    if (acceptable.some(a => a === normalized)) return true
    
    // Near-miss: allow small typos (Levenshtein distance <= 1 for short words)
    for (const correct of acceptable) {
      if (correct.length <= 3 && normalized === correct) return true
      if (correct.length > 3) {
        const distance = levenshteinDistance(normalized, correct)
        if (distance <= 1) return true
      }
    }
    
    return false
  }, [getAcceptableAnswers])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return

    const correct = checkAnswer(answer)
    setIsCorrect(correct)
    setShowResult(true)
  }

  function handleNext() {
    onAnswer(isCorrect, false)
    setAnswer('')
    setShowResult(false)
  }

  function handleOverride() {
    // "I knew that" - mark as correct despite typo
    onAnswer(true, true)
    setAnswer('')
    setShowResult(false)
  }

  // Handle Enter key to proceed after result
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showResult && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showResult, isCorrect])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
      {/* Prompt */}
      <div className="mb-8">
        {direction === 'en_to_jp' ? (
          <MeaningDisplay word={word} />
        ) : (
          <JapaneseText 
            word={word} 
            scriptLevel={scriptLevel} 
            direction={direction}
            size="xl"
          />
        )}
      </div>

      {!showResult ? (
        /* Input form */
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <Input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={direction === 'en_to_jp' ? 'Type in Japanese...' : 'Type meaning...'}
            className="drill-input text-center"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </form>
      ) : (
        /* Result */
        <div className="w-full max-w-sm space-y-6">
          <div className={`flex items-center justify-center gap-3 ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
            {isCorrect ? (
              <Check className="h-8 w-8" />
            ) : (
              <X className="h-8 w-8" />
            )}
            <span className="text-xl font-medium">
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>

          {/* Show correct answer if wrong */}
          {!isCorrect && (
            <div className="text-center space-y-2 py-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Correct answer:</p>
              {direction === 'en_to_jp' ? (
                <JapaneseText 
                  word={word} 
                  scriptLevel={scriptLevel} 
                  direction="jp_to_en"
                  size="lg"
                />
              ) : (
                <p className="text-xl">{word.meaning_en}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isCorrect && (
              <Button
                variant="outline"
                onClick={handleOverride}
                className="flex-1"
              >
                I knew that
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}
