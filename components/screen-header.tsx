"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  back?: boolean | string
  right?: React.ReactNode
  className?: string
}

export function ScreenHeader({ title, subtitle, back, right, className }: ScreenHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
