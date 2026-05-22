/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Simplified version based on FSRS-4.5 algorithm
 */

import { 
  type CardState, 
  type DrillResponse, 
  type UserWordProgress,
  DEFAULT_FSRS_PARAMETERS 
} from './types'

const DECAY = -0.5
const FACTOR = 0.9 ** (1 / DECAY) - 1

function forgettingCurve(elapsedDays: number, stability: number): number {
  return (1 + FACTOR * elapsedDays / stability) ** DECAY
}

function nextInterval(stability: number, requestRetention: number): number {
  return Math.round(stability / FACTOR * (requestRetention ** (1 / DECAY) - 1))
}

function initStability(response: DrillResponse): number {
  const w = DEFAULT_FSRS_PARAMETERS.w
  const grades: Record<DrillResponse, number> = { again: 1, hard: 2, good: 3, easy: 4 }
  const g = grades[response]
  return Math.max(w[g - 1], 0.1)
}

function initDifficulty(response: DrillResponse): number {
  const w = DEFAULT_FSRS_PARAMETERS.w
  const grades: Record<DrillResponse, number> = { again: 1, hard: 2, good: 3, easy: 4 }
  const g = grades[response]
  return Math.min(Math.max(w[4] - Math.exp(w[5] * (g - 1)) + 1, 1), 10)
}

function nextDifficulty(d: number, response: DrillResponse): number {
  const w = DEFAULT_FSRS_PARAMETERS.w
  const grades: Record<DrillResponse, number> = { again: 1, hard: 2, good: 3, easy: 4 }
  const g = grades[response]
  const deltD = -w[6] * (g - 3)
  const newD = d + deltD * (10 - d) / 9
  return Math.min(Math.max(w[4] + (newD - w[4]) * Math.exp(-w[7] * (g - 3)), 1), 10)
}

function nextRecallStability(
  d: number, 
  s: number, 
  r: number, 
  response: DrillResponse
): number {
  const w = DEFAULT_FSRS_PARAMETERS.w
  const grades: Record<DrillResponse, number> = { again: 1, hard: 2, good: 3, easy: 4 }
  const g = grades[response]
  
  const hardPenalty = response === 'hard' ? w[15] : 1
  const easyBonus = response === 'easy' ? w[16] : 1
  
  return s * (
    1 + 
    Math.exp(w[8]) * 
    (11 - d) * 
    Math.pow(s, -w[9]) * 
    (Math.exp((1 - r) * w[10]) - 1) * 
    hardPenalty * 
    easyBonus
  )
}

function nextForgetStability(d: number, s: number, r: number): number {
  const w = DEFAULT_FSRS_PARAMETERS.w
  return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14])
}

export interface FSRSOutput {
  stability: number
  difficulty: number
  scheduledDays: number
  state: CardState
  nextReview: Date
}

export function calculateNextReview(
  progress: UserWordProgress | null,
  response: DrillResponse,
  now: Date = new Date()
): FSRSOutput {
  const requestRetention = DEFAULT_FSRS_PARAMETERS.requestRetention
  const maxInterval = DEFAULT_FSRS_PARAMETERS.maximumInterval

  // New card
  if (!progress || progress.state === 'new') {
    const stability = initStability(response)
    const difficulty = initDifficulty(response)
    
    if (response === 'again') {
      return {
        stability,
        difficulty,
        scheduledDays: 0,
        state: 'learning',
        nextReview: new Date(now.getTime() + 60 * 1000) // 1 minute
      }
    }
    
    const interval = Math.min(nextInterval(stability, requestRetention), maxInterval)
    return {
      stability,
      difficulty,
      scheduledDays: interval,
      state: 'review',
      nextReview: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
    }
  }

  const { stability: s, difficulty: d, elapsed_days: elapsedDays } = progress
  const retrievability = forgettingCurve(elapsedDays, s)
  
  // Learning or relearning card
  if (progress.state === 'learning' || progress.state === 'relearning') {
    if (response === 'again') {
      return {
        stability: s,
        difficulty: nextDifficulty(d, response),
        scheduledDays: 0,
        state: progress.state,
        nextReview: new Date(now.getTime() + 60 * 1000)
      }
    }
    
    const newStability = nextRecallStability(d, s, retrievability, response)
    const interval = Math.min(nextInterval(newStability, requestRetention), maxInterval)
    
    return {
      stability: newStability,
      difficulty: nextDifficulty(d, response),
      scheduledDays: interval,
      state: 'review',
      nextReview: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
    }
  }

  // Review card
  const newDifficulty = nextDifficulty(d, response)
  
  if (response === 'again') {
    const newStability = nextForgetStability(d, s, retrievability)
    return {
      stability: newStability,
      difficulty: newDifficulty,
      scheduledDays: 0,
      state: 'relearning',
      nextReview: new Date(now.getTime() + 60 * 1000)
    }
  }
  
  const newStability = nextRecallStability(d, s, retrievability, response)
  const interval = Math.min(nextInterval(newStability, requestRetention), maxInterval)
  
  return {
    stability: newStability,
    difficulty: newDifficulty,
    scheduledDays: interval,
    state: 'review',
    nextReview: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)
  }
}

/**
 * Get cards due for review
 */
export function isDue(progress: UserWordProgress | null, now: Date = new Date()): boolean {
  if (!progress) return true // New cards are always "due"
  if (!progress.next_review) return true
  return new Date(progress.next_review) <= now
}

/**
 * Calculate retrievability (probability of recall)
 */
export function getRetrievability(progress: UserWordProgress | null, now: Date = new Date()): number {
  if (!progress || progress.state === 'new') return 0
  if (progress.stability === 0) return 0
  
  const lastReview = progress.last_review ? new Date(progress.last_review) : now
  const elapsedDays = (now.getTime() - lastReview.getTime()) / (24 * 60 * 60 * 1000)
  
  return forgettingCurve(elapsedDays, progress.stability)
}
