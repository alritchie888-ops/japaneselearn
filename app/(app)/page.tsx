import Link from "next/link"
import { ArrowRight, Calculator } from "lucide-react"
import { UnitList } from "@/components/learn/unit-list"

export default function LearnPage() {
  return (
    <>
      <div className="px-4 pt-6">
        <p className="font-jp text-sm text-primary">かな</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          Learn Hiragana & Katakana
        </h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Match sounds to characters, one row at a time.
        </p>
      </div>
      <UnitList />
      <div className="px-4 pb-2">
        <Link
          href="/practical"
          className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Calculator className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Practical Japanese</span>
            <span className="block text-xs text-muted-foreground text-pretty">
              Numbers, time, dates, counters &amp; money — unlocked by your kana.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>
    </>
  )
}
