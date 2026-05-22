'use client'

import type { Word } from '@/lib/types'
import { 
  getWordDisplay, 
  type ScriptLevel, 
  type DisplayDirection 
} from '@/lib/script-scaffold'

interface JapaneseTextProps {
  word: Word
  scriptLevel: ScriptLevel
  direction: DisplayDirection
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
}

/**
 * Displays Japanese text with appropriate script support
 * Handles romaji, hiragana, furigana (ruby), and kanji
 */
export function JapaneseText({ 
  word, 
  scriptLevel, 
  direction,
  className = '',
  size = 'lg'
}: JapaneseTextProps) {
  const display = getWordDisplay(word, scriptLevel, direction)
  const sizeClass = sizeClasses[size]

  // For furigana level, render with ruby annotations
  if (scriptLevel === 'furigana' && word.kanji && direction === 'jp_to_en') {
    return (
      <span className={`font-jp ${sizeClass} ${className}`}>
        <ruby>
          {word.kanji}
          <rt>{word.hiragana}</rt>
        </ruby>
      </span>
    )
  }

  return (
    <span className={`font-jp ${sizeClass} ${className}`}>
      {display.primary}
    </span>
  )
}

interface WordDisplayProps {
  word: Word
  scriptLevel: ScriptLevel
  showMeaning?: boolean
  showReading?: boolean
  className?: string
}

/**
 * Full word display with optional meaning and reading
 */
export function WordDisplay({
  word,
  scriptLevel,
  showMeaning = false,
  showReading = false,
  className = '',
}: WordDisplayProps) {
  return (
    <div className={`text-center space-y-2 ${className}`}>
      <JapaneseText 
        word={word} 
        scriptLevel={scriptLevel} 
        direction="jp_to_en"
        size="xl"
      />
      
      {showReading && scriptLevel !== 'romaji' && (
        <p className="text-muted-foreground text-lg font-jp">
          {word.romaji}
        </p>
      )}
      
      {showMeaning && (
        <p className="text-lg">
          {word.meaning_en}
        </p>
      )}
    </div>
  )
}

interface MeaningDisplayProps {
  word: Word
  className?: string
}

/**
 * Displays the English meaning of a word
 */
export function MeaningDisplay({ word, className = '' }: MeaningDisplayProps) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-2xl">{word.meaning_en}</p>
      {word.meaning_en_alt && word.meaning_en_alt.length > 0 && (
        <p className="text-muted-foreground text-sm mt-1">
          Also: {word.meaning_en_alt.join(', ')}
        </p>
      )}
    </div>
  )
}
