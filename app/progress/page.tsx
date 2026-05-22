import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressDashboard } from '@/components/progress-display'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Topic, UserTopicProgress, Unit, UserUnitProgress } from '@/lib/types'

// Estimate JLPT band based on vocabulary count and mastery
function estimateJLPTBand(
  totalWordsLearned: number,
  averageMastery: number
): string {
  // Rough estimates based on JLPT vocabulary requirements
  // N5: ~800 words, N4: ~1500, N3: ~3000, N2: ~6000, N1: ~10000+
  const effectiveWords = totalWordsLearned * (averageMastery / 100)
  
  if (effectiveWords < 100) return 'Pre-N5'
  if (effectiveWords < 400) return 'N5'
  if (effectiveWords < 800) return 'N4'
  if (effectiveWords < 1500) return 'N3'
  if (effectiveWords < 3000) return 'N2'
  return 'N1'
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get all topics with their progress
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true }) as { data: Topic[] | null }

  const { data: topicProgress } = await supabase
    .from('user_topic_progress')
    .select('*')
    .eq('user_id', user.id) as { data: UserTopicProgress[] | null }

  // Get unit counts per topic
  const { data: units } = await supabase
    .from('units')
    .select('id, topic_id')
    .eq('is_active', true) as { data: Pick<Unit, 'id' | 'topic_id'>[] | null }

  const { data: unitProgress } = await supabase
    .from('user_unit_progress')
    .select('unit_id, completed_at')
    .eq('user_id', user.id) as { data: Pick<UserUnitProgress, 'unit_id' | 'completed_at'>[] | null }

  // Get total words learned
  const { count: wordsLearned } = await supabase
    .from('user_word_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('reps', 0)

  // Create maps for lookups
  const topicProgressMap = new Map<string, UserTopicProgress>()
  if (topicProgress) {
    for (const p of topicProgress) {
      topicProgressMap.set(p.topic_id, p)
    }
  }

  const unitsPerTopic = new Map<string, number>()
  const unitIds = new Set<string>()
  if (units) {
    for (const u of units) {
      if (u.topic_id) {
        unitsPerTopic.set(u.topic_id, (unitsPerTopic.get(u.topic_id) || 0) + 1)
      }
      unitIds.add(u.id)
    }
  }

  const completedUnits = new Set<string>()
  if (unitProgress) {
    for (const p of unitProgress) {
      if (p.completed_at) {
        completedUnits.add(p.unit_id)
      }
    }
  }

  // Calculate average mastery
  let totalMastery = 0
  let topicCount = 0
  if (topicProgress) {
    for (const p of topicProgress) {
      totalMastery += Number(p.progress_percentage)
      topicCount++
    }
  }
  const averageMastery = topicCount > 0 ? totalMastery / topicCount : 0

  // Estimate JLPT band
  const jlptBand = estimateJLPTBand(wordsLearned || 0, averageMastery)

  // Build topic data for display
  const topicData = (topics || []).map(topic => {
    const progress = topicProgressMap.get(topic.id)
    const totalUnits = unitsPerTopic.get(topic.id) || 0
    
    // Count completed units for this topic
    let unitsCompleted = 0
    if (units) {
      for (const u of units) {
        if (u.topic_id === topic.id && completedUnits.has(u.id)) {
          unitsCompleted++
        }
      }
    }

    return {
      title: topic.title_en,
      icon: topic.icon || undefined,
      progress: Number(progress?.progress_percentage || 0),
      unitsCompleted,
      totalUnits,
    }
  })

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
        <h1 className="text-lg font-medium">Progress</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <ProgressDashboard 
          jlptBand={jlptBand}
          topics={topicData}
        />
        
        {/* Stats summary */}
        <div className="mt-6 p-4 bg-card rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-medium tabular-nums">{wordsLearned || 0}</p>
              <p className="text-xs text-muted-foreground">Words practiced</p>
            </div>
            <div>
              <p className="text-2xl font-medium tabular-nums">{topicCount}</p>
              <p className="text-xs text-muted-foreground">Topics started</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
