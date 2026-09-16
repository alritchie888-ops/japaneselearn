import { redirect } from "next/navigation"
import { getSessionSlug } from "@/lib/auth/session"
import { PROFILES } from "@/lib/store/profiles"
import { ProgressProvider } from "@/lib/store/progress"
import { AppShell } from "@/components/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const slug = await getSessionSlug()
  if (!slug || !PROFILES.some((p) => p.slug === slug)) {
    redirect("/login")
  }

  return (
    <ProgressProvider initialSlug={slug}>
      <AppShell>{children}</AppShell>
    </ProgressProvider>
  )
}
