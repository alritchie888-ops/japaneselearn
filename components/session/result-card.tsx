"use client"

import { cn } from "@/lib/utils"

interface Stat {
  label: string
  value: string
}

interface ResultCardProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  stats?: Stat[]
  children?: React.ReactNode
  tone?: "primary" | "success"
}

export function ResultCard({
  icon,
  title,
  subtitle,
  stats,
  children,
  tone = "primary",
}: ResultCardProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div
        className={cn(
          "flex size-20 animate-[pop-in_0.35s_ease-out] items-center justify-center rounded-full",
          tone === "success" ? "bg-success/15 text-success" : "bg-accent text-primary",
        )}
      >
        {icon}
      </div>
      <h2 className="mt-5 text-2xl font-bold text-foreground text-balance">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{subtitle}</p>}

      {stats && stats.length > 0 && (
        <dl className="mt-6 grid w-full grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-foreground">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8 flex w-full flex-col gap-2.5">{children}</div>
    </div>
  )
}
