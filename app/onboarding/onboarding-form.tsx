'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { IntentInput } from '@/components/intent-input'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface OnboardingFormProps {
  userId: string
  existingProfile: Profile | null
}

export function OnboardingForm({ userId, existingProfile }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [scriptIntention, setScriptIntention] = useState(25)
  const [isSaving, setIsSaving] = useState(false)

  async function completeOnboarding() {
    setIsSaving(true)
    const supabase = createClient()

    if (existingProfile) {
      await supabase
        .from('profiles')
        .update({
          script_intention: scriptIntention,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } else {
      await supabase
        .from('profiles')
        .insert({
          id: userId,
          script_intention: scriptIntention,
          onboarding_completed: true,
        })
    }

    setIsSaving(false)
    router.push('/learn')
    router.refresh()
  }

  if (step === 1) {
    return (
      <div className="space-y-8 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium">Welcome to Nihongo</h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your learning preferences.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-medium">How much Japanese script can you read?</h2>
            <p className="text-sm text-muted-foreground">
              Slide toward your comfort level. You can change this anytime.
            </p>
            
            <Slider
              value={[scriptIntention]}
              onValueChange={([v]) => setScriptIntention(v)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>romaji only</span>
              <span>hiragana</span>
              <span>furigana</span>
              <span>kanji</span>
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-medium">What do you want to do?</h1>
        <p className="text-muted-foreground">
          Name a real goal and we&apos;ll create lessons for it.
        </p>
      </div>

      <div className="space-y-4">
        <IntentInput 
          placeholder="order coffee, handle a cafe job, travel confidently..."
          generateTopic={false}
          onSubmit={async (intent) => {
            // Save onboarding and generate first topic
            setIsSaving(true)
            const supabase = createClient()

            // Complete onboarding
            if (existingProfile) {
              await supabase
                .from('profiles')
                .update({
                  script_intention: scriptIntention,
                  onboarding_completed: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
            } else {
              await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  script_intention: scriptIntention,
                  onboarding_completed: true,
                })
            }

            // Generate first topic
            const response = await fetch('/api/generate-topic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ intent }),
            })

            if (response.ok) {
              const data = await response.json()
              router.push(`/learn/${data.slug}`)
              router.refresh()
            } else {
              router.push('/learn')
              router.refresh()
            }
          }}
        />

        <p className="text-center text-sm text-muted-foreground">
          or
        </p>

        <Button 
          variant="outline" 
          onClick={completeOnboarding}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Setting up...' : 'Browse topics instead'}
        </Button>
      </div>
    </div>
  )
}
