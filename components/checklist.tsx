'use client'

import { Check, Circle, ChevronRight } from 'lucide-react'

export interface ChecklistStep {
  id: string
  label: string
  type: 'intro' | 'drill' | 'scenario' | 'voice'
  completed: boolean
}

interface ChecklistProps {
  steps: ChecklistStep[]
  currentStepIndex: number
  onStepClick: (step: ChecklistStep, index: number) => void
  className?: string
}

export function Checklist({ 
  steps, 
  currentStepIndex, 
  onStepClick,
  className = ''
}: ChecklistProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex
        const isDone = step.completed
        const isPast = index < currentStepIndex
        const isFuture = index > currentStepIndex && !isDone

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step, index)}
            disabled={isFuture && !isDone}
            className={`
              w-full checklist-item
              ${isCurrent ? 'checklist-item-current' : ''}
              ${isDone ? 'checklist-item-done' : ''}
              ${isFuture && !isDone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-secondary/50'}
            `}
          >
            <div className="shrink-0">
              {isDone ? (
                <Check className="h-5 w-5 text-accent" />
              ) : isCurrent ? (
                <Circle className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <span className={`flex-1 text-left text-sm ${isCurrent ? 'font-medium' : ''}`}>
              {step.label}
            </span>
            
            {(isCurrent || (isDone && !isPast)) && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        )
      })}
    </div>
  )
}

interface ChecklistHeaderProps {
  title: string
  canDoStatement: string
  progressPct: number
}

export function ChecklistHeader({ 
  title, 
  canDoStatement, 
  progressPct 
}: ChecklistHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{canDoStatement}</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{Math.round(progressPct)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
