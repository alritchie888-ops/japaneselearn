import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntentInput } from '@/components/intent-input'
import { TopicList } from '@/components/topic-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Topic, UserTopicProgress, Profile } from '@/lib/types'
import { BarChart3, LogOut, Settings } from 'lucide-react'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get profile to check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  // Get all active topics
  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true }) as { data: Topic[] | null }

  // Get user's topic progress
  const { data: topicProgress } = await supabase
    .from('user_topic_progress')
    .select('*')
    .eq('user_id', user.id) as { data: UserTopicProgress[] | null }

  // Create progress map
  const progressMap = new Map<string, UserTopicProgress>()
  if (topicProgress) {
    for (const p of topicProgress) {
      progressMap.set(p.topic_id, p)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-medium">Nihongo</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/progress">
              <BarChart3 className="h-5 w-5" />
              <span className="sr-only">Progress</span>
            </Link>
          </Button>
          <form action="/api/auth/signout" method="POST">
            <Button type="submit" variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Intent input */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            What do you want to study?
          </label>
          <IntentInput placeholder="order coffee, travel phrases, numbers..." />
        </div>

        {/* Topics list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Your topics</h2>
          <TopicList 
            topics={topics || []} 
            progressMap={progressMap}
          />
        </div>
      </main>
    </div>
  )
}
