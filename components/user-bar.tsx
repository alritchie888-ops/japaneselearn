"use client"

import { useState } from "react"
import Link from "next/link"
import { useProgress } from "@/lib/store/progress"
import { Check, Cloud, Loader2, LogOut, Settings } from "lucide-react"

export function UserBar() {
  const { activeProfile, saving, hydrated } = useProgress()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // ignore — navigate regardless
    }
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            {activeProfile.name.charAt(0)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{activeProfile.name}</p>
            <p
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
              aria-live="polite"
            >
              {!hydrated ? (
                <>
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Loading
                </>
              ) : saving ? (
                <>
                  <Cloud className="size-3" aria-hidden="true" />
                  Saving
                </>
              ) : (
                <>
                  <Check className="size-3 text-primary" aria-hidden="true" />
                  Saved
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
