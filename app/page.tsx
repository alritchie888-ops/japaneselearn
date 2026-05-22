import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { IntentInput } from '@/components/intent-input'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to learn page
  if (user) {
    // Check if onboarding is completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      redirect('/onboarding')
    }
    redirect('/learn')
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8 text-center">
          {/* Logo/Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="font-jp">日本語</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Nihongo — Learn Japanese
            </p>
          </div>

          {/* Tagline */}
          <p className="text-xl text-balance">
            Name what you want to do. Learn the language to do it.
          </p>

          {/* Intent Input */}
          <div className="space-y-4">
            <IntentInput 
              placeholder="I want to order coffee in Tokyo..."
              generateTopic={false}
            />
            <p className="text-sm text-muted-foreground">
              or start with a popular topic
            </p>
          </div>

          {/* Quick Start Topics */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Ordering food', 'Introducing yourself', 'Getting directions', 'Shopping'].map((topic) => (
              <Button 
                key={topic} 
                variant="secondary" 
                size="sm"
                asChild
              >
                <Link href={`/learn?intent=${encodeURIComponent(topic)}`}>
                  {topic}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Links */}
      <footer className="border-t py-6 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Track your progress and save your learning
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  )
}
