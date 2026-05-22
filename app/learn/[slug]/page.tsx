import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopicLearningView } from '@/components/topic-learning-view'
import type { Topic, Unit, Word, WordUnitLink, UserUnitProgress, UserWordProgress, Profile } from '@/lib/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile for script intention
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  // Get the topic
  const { data: topic } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single() as { data: Topic | null }

  if (!topic) {
    notFound()
  }

  // Get all units for this topic
  const { data: units } = await supabase
    .from('units')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true }) as { data: Unit[] | null }

  // Get all words linked to these units
  const unitIds = (units || []).map(u => u.id)
  
  const { data: wordLinks } = await supabase
    .from('word_unit_links')
    .select('*')
    .in('unit_id', unitIds.length > 0 ? unitIds : ['none']) as { data: WordUnitLink[] | null }

  const wordIds = [...new Set((wordLinks || []).map(l => l.word_id))]
  
  const { data: words } = await supabase
    .from('words')
    .select('*')
    .in('id', wordIds.length > 0 ? wordIds : ['none']) as { data: Word[] | null }

  // Get user progress for units
  const { data: unitProgress } = await supabase
    .from('user_unit_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('unit_id', unitIds.length > 0 ? unitIds : ['none']) as { data: UserUnitProgress[] | null }

  // Get user progress for words
  const { data: wordProgress } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('word_id', wordIds.length > 0 ? wordIds : ['none']) as { data: UserWordProgress[] | null }

  // Calculate script level from intention (0-100 → 0-3)
  const scriptIntention = profile?.script_intention ?? 50
  const scriptLevelIndex = Math.min(3, Math.floor(scriptIntention / 25))
  const scriptLevels = ['romaji', 'hiragana', 'furigana', 'kanji'] as const
  const scriptLevel = scriptLevels[scriptLevelIndex]

  return (
    <TopicLearningView
      topic={topic}
      units={units || []}
      words={words || []}
      wordLinks={wordLinks || []}
      unitProgress={unitProgress || []}
      wordProgress={wordProgress || []}
      scriptLevel={scriptLevel}
      userId={user.id}
    />
  )
}
