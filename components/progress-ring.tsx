import { cn } from "@/lib/utils"

interface ProgressRingProps {
  /** 0..1 */
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  children?: React.ReactNode
}

export function ProgressRing({
  value,
  size = 44,
  strokeWidth = 4,
  className,
  trackClassName,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, value))
  const dash = circumference * clamped

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("text-border", trackClassName)}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn("text-primary transition-[stroke-dasharray] duration-500", className)}
          stroke="currentColor"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </div>
  )
}
