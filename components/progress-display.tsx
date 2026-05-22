'use client'

interface ProgressScaleProps {
  label: string
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

export function ProgressScale({ 
  label, 
  value, 
  showLabel = true,
  size = 'md'
}: ProgressScaleProps) {
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums">{Math.round(value)}%</span>
        </div>
      )}
      <div className={`bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

interface JLPTBandDisplayProps {
  band: string // 'N5', 'N4', 'N3', 'N2', 'N1', or 'Pre-N5'
  progressWithinBand?: number
}

const JLPT_BANDS = ['Pre-N5', 'N5', 'N4', 'N3', 'N2', 'N1'] as const

export function JLPTBandDisplay({ band, progressWithinBand = 0 }: JLPTBandDisplayProps) {
  const bandIndex = JLPT_BANDS.indexOf(band as typeof JLPT_BANDS[number])

  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-sm text-muted-foreground">JLPT Estimate</span>
        <span className="text-2xl font-medium">{band}</span>
      </div>
      
      {/* Band visualization */}
      <div className="flex gap-1">
        {JLPT_BANDS.map((b, i) => (
          <div 
            key={b}
            className={`
              flex-1 h-2 rounded-sm
              ${i < bandIndex ? 'bg-accent' : ''}
              ${i === bandIndex ? 'bg-accent/50' : ''}
              ${i > bandIndex ? 'bg-muted' : ''}
            `}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Pre-N5</span>
        <span>N1</span>
      </div>
    </div>
  )
}

interface TopicProgressCardProps {
  title: string
  icon?: string
  progress: number
  unitsCompleted: number
  totalUnits: number
}

export function TopicProgressCard({
  title,
  icon,
  progress,
  unitsCompleted,
  totalUnits,
}: TopicProgressCardProps) {
  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <h3 className="font-medium">{title}</h3>
        </div>
        <span className="text-lg font-medium tabular-nums">{Math.round(progress)}%</span>
      </div>
      
      <ProgressScale label="" value={progress} showLabel={false} size="sm" />
      
      <p className="text-xs text-muted-foreground mt-2">
        {unitsCompleted} / {totalUnits} units complete
      </p>
    </div>
  )
}

interface ProgressDashboardProps {
  jlptBand: string
  topics: Array<{
    title: string
    icon?: string
    progress: number
    unitsCompleted: number
    totalUnits: number
  }>
}

export function ProgressDashboard({ jlptBand, topics }: ProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <JLPTBandDisplay band={jlptBand} />
      
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Topics</h2>
        {topics.map((topic, i) => (
          <TopicProgressCard key={i} {...topic} />
        ))}
      </div>
    </div>
  )
}
