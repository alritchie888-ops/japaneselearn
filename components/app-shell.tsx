"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Shuffle, Zap, TrendingUp, Calculator, Ear } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserBar } from "./user-bar"

const NAV = [
  { href: "/", label: "Learn", icon: BookOpen },
  { href: "/practical", label: "Practical", icon: Calculator },
  { href: "/listen", label: "Listen", icon: Ear },
  { href: "/practice", label: "Practice", icon: Shuffle },
  { href: "/speed", label: "Speed", icon: Zap },
  { href: "/progress", label: "Progress", icon: TrendingUp },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <UserBar />
      <main className="flex-1 pb-24">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 transition-transform", active && "scale-110")}
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
