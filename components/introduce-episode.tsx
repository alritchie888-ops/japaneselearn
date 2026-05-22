'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WordDisplay } from '@/components/japanese-text'
import type { Word, WordUnitLink } from '@/lib/types'
import type { ScriptLevel } from '@/lib/script-scaffold'
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'

interface IntroduceEpisodeProps {
  words: Array<{
    word: Word
    link: WordUnitLink
  }>
  scriptLevel: ScriptLevel
  onComplete: () => void
}

/**
 * Introduce Episode - first encounter with new words
 * Rich media: image, audio, context sentence
 * One-tap "predict the meaning" beat
 */
export function IntroduceEpisode({ 
  words, 
  scriptLevel, 
  onComplete 
}: IntroduceEpisodeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)

  const currentItem = words[currentIndex]
  const isLast = currentIndex === words.length - 1
  const progress = ((currentIndex + 1) / words.length) * 100

  function handleNext() {
    if (isLast) {
      onComplete()
    } else {
      setCurrentIndex(prev => prev + 1)
      setShowMeaning(false)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowMeaning(false)
    }
  }

  function handleReveal() {
    setShowMeaning(true)
  }

  function playAudio() {
    // TODO: Implement audio playback when audio_url is available
    // For now, use Web Speech API as fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentItem.word.hiragana)
      utterance.lang = 'ja-JP'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Progress bar */}
      <div className="px-4 py-3 border-b">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Word display */}
        <div className="mb-8">
          <WordDisplay
            word={currentItem.word}
            scriptLevel={scriptLevel}
            showMeaning={showMeaning}
            showReading={showMeaning}
          />
        </div>

        {/* Audio button */}
        <Button
          variant="outline"
          size="icon"
          className="mb-8"
          onClick={playAudio}
        >
          <Volume2 className="h-5 w-5" />
          <span className="sr-only">Play audio</span>
        </Button>

        {/* Context sentence */}
        {currentItem.link.context_sentence_ja && (
          <div className="text-center mb-8 p-4 bg-secondary rounded-lg max-w-sm">
            <p className="font-jp text-lg">{currentItem.link.context_sentence_ja}</p>
            {showMeaning && currentItem.link.context_sentence_en && (
              <p className="text-muted-foreground text-sm mt-2">
                {currentItem.link.context_sentence_en}
              </p>
            )}
          </div>
        )}

        {/* Reveal / Next button */}
        {!showMeaning ? (
          <Button onClick={handleReveal} size="lg" className="w-full max-w-xs">
            Show meaning
          </Button>
        ) : (
          <Button onClick={handleNext} size="lg" className="w-full max-w-xs">
            {isLast ? 'Complete' : 'Next word'}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous</span>
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {words.length}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  )
}
