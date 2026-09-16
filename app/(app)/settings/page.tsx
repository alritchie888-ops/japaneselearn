import { RomajiControl } from "@/components/practical/romaji-control"
import { ScreenHeader } from "@/components/screen-header"
import { ResetProgress } from "@/components/settings/reset-progress"

export default function SettingsPage() {
  return (
    <>
      <ScreenHeader title="Settings" back="/" />
      <div className="space-y-6 p-4">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Romaji reading aid</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground text-pretty">
            Romaji helps you read at first, then gets out of the way. This applies across the
            Practical Japanese lessons.
          </p>
          <RomajiControl />
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Reset progress</h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground text-pretty">
            Clears mastery, streaks and lesson history for the current profile. This can&apos;t be
            undone.
          </p>
          <ResetProgress />
        </section>
      </div>
    </>
  )
}
