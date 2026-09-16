"use client"

import { useProgress } from "@/lib/store/progress"
import { Trash2 } from "lucide-react"

export function ResetProgress() {
  const { reset, hydrated } = useProgress()
  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={() => {
        if (window.confirm("Reset all progress for this profile? This cannot be undone.")) reset()
      }}
      className="flex items-center gap-2 rounded-2xl border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Reset progress
    </button>
  )
}
