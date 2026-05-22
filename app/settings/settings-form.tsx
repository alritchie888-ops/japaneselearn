'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface SettingsFormProps {
  profile: Profile | null
  userId: string
}

const SCRIPT_LABELS = [
  { value: 0, label: 'romaji' },
  { value: 33, label: 'hiragana' },
  { value: 66, label: 'furigana' },
  { value: 100, label: 'kanji' },
]

const PACE_LABELS = [
  { value: 0, label: 'relaxed' },
  { value: 50, label: 'steady' },
  { value: 100, label: 'intensive' },
]

export function SettingsForm({ profile, userId }: SettingsFormProps) {
  const router = useRouter()
  const [scriptIntention, setScriptIntention] = useState(profile?.script_intention ?? 50)
  const [paceIntention, setPaceIntention] = useState(profile?.pace_intention ?? 50)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()
    
    await supabase
      .from('profiles')
      .update({
        script_intention: scriptIntention,
        pace_intention: paceIntention,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    
    setIsSaving(false)
    router.push('/learn')
  }

  function getCurrentLabel(value: number, labels: typeof SCRIPT_LABELS): string {
    const sorted = [...labels].sort((a, b) => 
      Math.abs(a.value - value) - Math.abs(b.value - value)
    )
    return sorted[0].label
  }

  return (
    <div className="space-y-8 max-w-md">
      {/* Script intention */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="font-medium">Script Level</h2>
          <span className="text-sm text-muted-foreground">
            {getCurrentLabel(scriptIntention, SCRIPT_LABELS)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          How much Japanese script do you want to see?
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
          {SCRIPT_LABELS.map(l => (
            <span key={l.value}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Pace intention */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="font-medium">Learning Pace</h2>
          <span className="text-sm text-muted-foreground">
            {getCurrentLabel(paceIntention, PACE_LABELS)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          How many new words per session?
        </p>
        <Slider
          value={[paceIntention]}
          onValueChange={([v]) => setPaceIntention(v)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {PACE_LABELS.map(l => (
            <span key={l.value}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Save button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? 'Saving...' : 'Save settings'}
      </Button>
    </div>
  )
}
