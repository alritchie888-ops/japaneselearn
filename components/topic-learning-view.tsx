'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checklist, ChecklistHeader, type ChecklistStep } from '@/components/checklist'
import { DrillSession, type DrillResult } from '@/components/drill-session'
import { IntroduceEpisode } from '@/components/introduce-episode'
import { IntentInput } from '@/components/intent-input'
import { createClient } from '@/lib/supabase/client'
import { createBilateralSession, type SessionWord } from '@/lib/session-scheduler'
import type { Topic, Unit, Word, WordUnitLink, UserUnitProgress, UserWordProgress } from '@/lib/types'
import type { ScriptLevel } from '@/lib/script-scaffold'
import { ArrowLeft, X } from 'lucide-react'

interface TopicLearningViewProps {
  topic: Topic
  units: Unit[]
  words: Word[]
  wordLinks: WordUnitLink[]
  unitProgress: UserUnitProgress[]
  wordProgress: UserWordProgress[]
  scriptLevel: ScriptLevel
  userId: string
}

type EpisodeType = 'intro' | 'drill' | 'scenario' | 'voice' | null

export function TopicLearningView({
  topic,
  units,
  words,
  wordLinks,
  unitProgress,
  wordProgress,
  scriptLevel,
  userId,
}: TopicLearningViewProps) {
  const router = useRouter()
  const [activeEpisode, setActiveEpisode] = useState<EpisodeType>(null)
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0)
  const [sessionWords, setSessionWords] = useState<SessionWord[]>([])
  const [localUnitProgress, setLocalUnitProgress] = useState(unitProgress)
  const [localWordProgress, setLocalWordProgress] = useState(wordProgress)

  const currentUnit = units[currentUnitIndex]
  const currentUnitProgressData = localUnitProgress.find(p => p.unit_id === currentUnit?.id)

  // Get words for current unit
  const currentUnitWords = words.filter(w => 
    wordLinks.some(l => l.word_id === w.id && l.unit_id === currentUnit?.id)
  )
  const currentUnitLinks = wordLinks.filter(l => l.unit_id === currentUnit?.id)

  // Build checklist steps for current unit
  const checklistSteps: ChecklistStep[] = currentUnit ? [
    {
      id: 'intro',
      label: 'Learn new words',
      type: 'intro',
      completed: currentUnitProgressData?.intro_completed || false,
    },
    {
      id: 'drill',
      label: 'Practice drill',
      type: 'drill',
      completed: currentUnitProgressData?.drill_completed || false,
    },
    {
      id: 'scenario',
      label: 'Try a scenario',
      type: 'scenario',
      completed: currentUnitProgressData?.scenario_completed || false,
    },
    {
      id: 'voice',
      label: 'Speak it',
      type: 'voice',
      completed: currentUnitProgressData?.voice_completed || false,
    },
  ] : []

  // Find current step index
  const currentStepIndex = checklistSteps.findIndex(s => !s.completed)

  // Calculate overall progress
  const completedSteps = checklistSteps.filter(s => s.completed).length
  const progressPct = checklistSteps.length > 0 
    ? (completedSteps / checklistSteps.length) * 100 
    : 0

  // Handle step click
  function handleStepClick(step: ChecklistStep) {
    if (step.type === 'intro') {
      startIntroEpisode()
    } else if (step.type === 'drill') {
      startDrillEpisode()
    } else if (step.type === 'scenario') {
      // TODO: Implement scenario episode
      alert('Scenario episodes coming soon')
    } else if (step.type === 'voice') {
      // TODO: Implement voice episode
      alert('Voice episodes coming soon')
    }
  }

  // Start introduce episode
  function startIntroEpisode() {
    setActiveEpisode('intro')
  }

  // Start drill episode
  function startDrillEpisode() {
    // Get words that need practicing for this unit
    const unitWordProgress = localWordProgress.filter(p => 
      currentUnitWords.some(w => w.id === p.word_id)
    )

    // Create a bilateral session
    const session = createBilateralSession(
      currentUnitWords,
      currentUnitLinks,
      unitWordProgress
    )

    // If no words due, add all words as new
    if (session.length === 0 && currentUnitWords.length > 0) {
      const newSession: SessionWord[] = currentUnitWords.slice(0, 10).flatMap(word => {
        const link = currentUnitLinks.find(l => l.word_id === word.id)!
        return [
          { word, progress: null, link, pool: 'new' as const, direction: 'en_to_jp' as const },
          { word, progress: null, link, pool: 'new' as const, direction: 'jp_to_en' as const },
        ]
      })
      setSessionWords(newSession)
    } else {
      setSessionWords(session)
    }

    setActiveEpisode('drill')
  }

  // Handle drill completion
  const handleDrillComplete = useCallback(async (results: DrillResult[]) => {
    const supabase = createClient()

    // Update word progress in database
    for (const result of results) {
      const existingProgress = localWordProgress.find(
        p => p.word_id === result.wordId && p.direction === result.direction
      )

      if (existingProgress) {
        // Update existing progress
        await supabase
          .from('user_word_progress')
          .update({
            ...result.newProgress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id)
      } else {
        // Insert new progress
        await supabase
          .from('user_word_progress')
          .insert({
            user_id: userId,
            word_id: result.wordId,
            direction: result.direction,
            ...result.newProgress,
          })
      }
    }

    // Mark drill as completed for this unit
    if (currentUnit) {
      const existingUnitProgress = localUnitProgress.find(p => p.unit_id === currentUnit.id)
      
      if (existingUnitProgress) {
        await supabase
          .from('user_unit_progress')
          .update({ drill_completed: true })
          .eq('id', existingUnitProgress.id)
        
        setLocalUnitProgress(prev => 
          prev.map(p => p.id === existingUnitProgress.id 
            ? { ...p, drill_completed: true } 
            : p
          )
        )
      } else {
        const { data } = await supabase
          .from('user_unit_progress')
          .insert({
            user_id: userId,
            unit_id: currentUnit.id,
            drill_completed: true,
            started_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (data) {
          setLocalUnitProgress(prev => [...prev, data as UserUnitProgress])
        }
      }
    }

    // Refresh word progress
    const { data: newWordProgress } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)

    if (newWordProgress) {
      setLocalWordProgress(newWordProgress as UserWordProgress[])
    }

    setActiveEpisode(null)
  }, [currentUnit, localUnitProgress, localWordProgress, userId])

  // Handle intro completion
  const handleIntroComplete = useCallback(async () => {
    const supabase = createClient()

    // Mark intro as completed for this unit
    if (currentUnit) {
      const existingUnitProgress = localUnitProgress.find(p => p.unit_id === currentUnit.id)
      
      if (existingUnitProgress) {
        await supabase
          .from('user_unit_progress')
          .update({ intro_completed: true })
          .eq('id', existingUnitProgress.id)
        
        setLocalUnitProgress(prev => 
          prev.map(p => p.id === existingUnitProgress.id 
            ? { ...p, intro_completed: true } 
            : p
          )
        )
      } else {
        const { data } = await supabase
          .from('user_unit_progress')
          .insert({
            user_id: userId,
            unit_id: currentUnit.id,
            intro_completed: true,
            started_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (data) {
          setLocalUnitProgress(prev => [...prev, data as UserUnitProgress])
        }
      }
    }

    setActiveEpisode(null)
  }, [currentUnit, localUnitProgress, userId])

  // Exit episode
  function handleExitEpisode() {
    setActiveEpisode(null)
  }

  // Render active episode
  if (activeEpisode === 'intro' && currentUnitWords.length > 0) {
    const introWords = currentUnitWords.map(word => ({
      word,
      link: currentUnitLinks.find(l => l.word_id === word.id)!,
    }))

    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center gap-4 px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={handleExitEpisode}>
            <X className="h-5 w-5" />
            <span className="sr-only">Exit</span>
          </Button>
          <h1 className="text-lg font-medium">Learn new words</h1>
        </header>
        <IntroduceEpisode
          words={introWords}
          scriptLevel={scriptLevel}
          onComplete={handleIntroComplete}
        />
      </div>
    )
  }

  if (activeEpisode === 'drill' && sessionWords.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <DrillSession
          sessionWords={sessionWords}
          scriptLevel={scriptLevel}
          onComplete={handleDrillComplete}
          onExit={handleExitEpisode}
        />
      </div>
    )
  }

  // Main chapter view
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b">
        <Button asChild variant="ghost" size="icon">
          <Link href="/learn">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-medium">{topic.title_en}</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Unit selector (if multiple units) */}
        {units.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {units.map((unit, index) => (
              <Button
                key={unit.id}
                variant={index === currentUnitIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentUnitIndex(index)}
                className="shrink-0"
              >
                {unit.title_en}
              </Button>
            ))}
          </div>
        )}

        {/* Current unit checklist */}
        {currentUnit && (
          <div className="space-y-6">
            <ChecklistHeader
              title={currentUnit.title_en}
              canDoStatement={currentUnit.can_do_statement}
              progressPct={progressPct}
            />

            <Checklist
              steps={checklistSteps}
              currentStepIndex={currentStepIndex >= 0 ? currentStepIndex : checklistSteps.length}
              onStepClick={handleStepClick}
            />
          </div>
        )}

        {/* No units message */}
        {units.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No units available yet.</p>
            <p className="text-sm mt-1">Content is being generated...</p>
          </div>
        )}

        {/* Intent input for steering */}
        <div className="pt-6 border-t">
          <IntentInput 
            placeholder="Ask about this topic..."
            onSubmit={(intent) => {
              // Could be used for scenario generation or topic expansion
              console.log('Intent:', intent)
            }}
          />
        </div>
      </main>
    </div>
  )
}
