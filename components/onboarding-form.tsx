'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

const SCRIPT_LEVELS = [
  { value: 0, label: 'Romaji', description: 'koohii', example: 'koohii' },
  { value: 33, label: 'Hiragana', description: 'こーひー', example: 'こーひー' },
  { value: 66, label: 'Furigana', description: 'Reading aids on kanji', example: '珈琲' },
  { value: 100, label: 'Kanji', description: '珈琲', example: '珈琲' },
]

function getScriptLevel(value: number): typeof SCRIPT_LEVELS[number] {
  if (value <= 16) return SCRIPT_LEVELS[0]
  if (value <= 50) return SCRIPT_LEVELS[1]
  if (value <= 83) return SCRIPT_LEVELS[2]
  return SCRIPT_LEVELS[3]
}

export function OnboardingForm() {
  const router = useRouter()
  const [scriptIntention, setScriptIntention] = useState(50)
  const [learningGoal, setLearningGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentLevel = getScriptLevel(scriptIntention)

  async function handleSubmit() {
    setIsSubmitting(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('profiles')
        .update({
          script_intention: scriptIntention,
          learning_goal: learningGoal || null,
          onboarding_completed: true,
        })
        .eq('id', user.id)
    }
    
    router.push('/learn')
    router.refresh()
  }

  function handleSkip() {
    router.push('/learn')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-12">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">How do you want to read Japanese?</h1>
            <p className="text-muted-foreground text-sm">
              This sets your starting point. The app adjusts from your real performance.
            </p>
          </div>

          {/* Script intention slider */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Slider
                value={[scriptIntention]}
                onValueChange={([v]) => setScriptIntention(v)}
                max={100}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                {SCRIPT_LEVELS.map((level) => (
                  <span 
                    key={level.value}
                    className={currentLevel.value === level.value ? 'text-foreground font-medium' : ''}
                  >
                    {level.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Current selection display */}
            <div className="text-center space-y-3 py-6 border rounded-lg bg-card">
              <p className="text-3xl font-jp">{currentLevel.example}</p>
              <p className="text-sm text-muted-foreground">{currentLevel.description}</p>
            </div>
          </div>

          {/* Optional learning goal */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">
              What do you want to learn? (optional)
            </label>
            <Textarea
              placeholder="order coffee, handle a cafe job, travel phrases..."
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Setting up...' : 'Start learning'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
