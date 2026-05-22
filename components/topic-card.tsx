'use client'

import Link from 'next/link'
import type { Topic, UserTopicProgress } from '@/lib/types'

interface TopicCardProps {
  topic: Topic
  progress?: UserTopicProgress | null
}

export function TopicCard({ topic, progress }: TopicCardProps) {
  const progressPct = progress?.progress_percentage || 0

  return (
    <Link 
      href={`/learn/${topic.slug}`}
      className="block p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {topic.icon && <span className="text-lg">{topic.icon}</span>}
            <h3 className="font-medium truncate">{topic.title_en}</h3>
          </div>
          {topic.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-medium tabular-nums">{Math.round(progressPct)}%</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 progress-bar">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Link>
  )
}

interface TopicListProps {
  topics: Topic[]
  progressMap: Map<string, UserTopicProgress>
}

export function TopicList({ topics, progressMap }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No topics yet.</p>
        <p className="text-sm mt-1">Type what you want to learn above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <TopicCard 
          key={topic.id} 
          topic={topic} 
          progress={progressMap.get(topic.id)}
        />
      ))}
    </div>
  )
}
