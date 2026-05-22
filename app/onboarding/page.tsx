import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import type { Profile } from '@/lib/types'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  // Already onboarded
  if (profile?.onboarding_completed) {
    redirect('/learn')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col justify-center px-4 py-12">
        <OnboardingForm userId={user.id} existingProfile={profile} />
      </main>
    </div>
  )
}
