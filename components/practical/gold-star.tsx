import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Universal marker for an irregular reading. Its prominence (`level`) shrinks
 * as the learner masters the item: 2 = prominent pill, 1 = subtle icon, 0 =
 * hidden. Used identically across every practical category.
 */
export function GoldStar({ level, className }: { level: number; className?: string }) {
  if (level <= 0) return null
  if (level === 1) {
    return (
      <Star
        className={cn("size-3.5 fill-star text-star", className)}
        aria-label="Irregular reading"
      />
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-star/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-star",
        className,
      )}
    >
      <Star className="size-3 fill-star text-star" aria-hidden="true" />
      Special reading
    </span>
  )
}
