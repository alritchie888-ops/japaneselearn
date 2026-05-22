/**
 * Session Scheduler
 * Balances three pools: new (introduce), weak (remediate), due (maintain)
 * Composes sessions that cluster related words for scenario generation
 */

import type { Word, UserWordProgress, WordUnitLink } from './types'

export interface SessionWord {
  word: Word
  progress: UserWordProgress | null
  link: WordUnitLink
  pool: 'new' | 'weak' | 'due'
  direction: 'en_to_jp' | 'jp_to_en'
}

export interface SessionConfig {
  maxNewWords: number
  maxWeakWords: number
  maxDueWords: number
  targetSessionSize: number
}

const DEFAULT_CONFIG: SessionConfig = {
  maxNewWords: 5,
  maxWeakWords: 8,
  maxDueWords: 15,
  targetSessionSize: 20,
}

/**
 * Categorizes words into pools based on their progress state
 */
export function categorizeWords(
  words: Word[],
  links: WordUnitLink[],
  progress: UserWordProgress[],
  direction: 'en_to_jp' | 'jp_to_en'
): { new: SessionWord[]; weak: SessionWord[]; due: SessionWord[] } {
  const now = new Date()
  const progressMap = new Map(
    progress
      .filter(p => p.direction === direction)
      .map(p => [p.word_id, p])
  )
  const linkMap = new Map(links.map(l => [l.word_id, l]))

  const pools = {
    new: [] as SessionWord[],
    weak: [] as SessionWord[],
    due: [] as SessionWord[],
  }

  for (const word of words) {
    const prog = progressMap.get(word.id) || null
    const link = linkMap.get(word.id)
    if (!link) continue

    const sessionWord: SessionWord = {
      word,
      progress: prog,
      link,
      pool: 'new',
      direction,
    }

    if (!prog || prog.state === 'new') {
      // Never seen or explicitly new
      sessionWord.pool = 'new'
      pools.new.push(sessionWord)
    } else if (prog.state === 'relearning' || prog.lapses > 2) {
      // Weak: failed recently or has multiple lapses
      sessionWord.pool = 'weak'
      pools.weak.push(sessionWord)
    } else if (prog.next_review && new Date(prog.next_review) <= now) {
      // Due for review
      sessionWord.pool = 'due'
      pools.due.push(sessionWord)
    }
  }

  // Sort each pool
  // New: by sort order in the unit
  pools.new.sort((a, b) => a.link.sort_order - b.link.sort_order)
  
  // Weak: by number of lapses (most problematic first)
  pools.weak.sort((a, b) => (b.progress?.lapses || 0) - (a.progress?.lapses || 0))
  
  // Due: by overdue-ness (most overdue first)
  pools.due.sort((a, b) => {
    const aDate = a.progress?.next_review ? new Date(a.progress.next_review).getTime() : 0
    const bDate = b.progress?.next_review ? new Date(b.progress.next_review).getTime() : 0
    return aDate - bDate
  })

  return pools
}

/**
 * Composes a session from the three pools
 * Front-loads weak/due items, introduces new items gradually
 */
export function composeSession(
  pools: { new: SessionWord[]; weak: SessionWord[]; due: SessionWord[] },
  config: SessionConfig = DEFAULT_CONFIG
): SessionWord[] {
  const session: SessionWord[] = []

  // Take from each pool up to limits
  const weakSlice = pools.weak.slice(0, config.maxWeakWords)
  const dueSlice = pools.due.slice(0, config.maxDueWords)
  const newSlice = pools.new.slice(0, config.maxNewWords)

  // Interleave: start with some weak/due, then sprinkle new throughout
  // Pattern: 3 review items, 1 new item (roughly)
  const reviewItems = [...weakSlice, ...dueSlice]
  const newItems = [...newSlice]

  let reviewIndex = 0
  let newIndex = 0

  while (
    session.length < config.targetSessionSize &&
    (reviewIndex < reviewItems.length || newIndex < newItems.length)
  ) {
    // Add 3 review items
    for (let i = 0; i < 3 && reviewIndex < reviewItems.length; i++) {
      session.push(reviewItems[reviewIndex++])
    }
    // Add 1 new item
    if (newIndex < newItems.length) {
      session.push(newItems[newIndex++])
    }
  }

  return session
}

/**
 * Groups session words by relationship tag for scenario generation
 */
export function clusterByRelationship(
  words: SessionWord[]
): Map<string, SessionWord[]> {
  const clusters = new Map<string, SessionWord[]>()

  for (const word of words) {
    // Use relationship_tag from link, or default to 'general'
    // Note: relationship_tag would be on word_unit_links in a fuller implementation
    const tag = 'general' // Simplified for MVP
    if (!clusters.has(tag)) {
      clusters.set(tag, [])
    }
    clusters.get(tag)!.push(word)
  }

  return clusters
}

/**
 * Determines which words need introduction (media-rich first encounter)
 */
export function getIntroductionWords(session: SessionWord[]): SessionWord[] {
  return session.filter(w => w.pool === 'new')
}

/**
 * Determines which words are ready for scenario practice
 * (at least seen once, not brand new)
 */
export function getScenarioReadyWords(session: SessionWord[]): SessionWord[] {
  return session.filter(w => w.pool !== 'new' && w.progress && w.progress.reps > 0)
}

/**
 * Calculates session stats for display
 */
export function getSessionStats(session: SessionWord[]): {
  total: number
  new: number
  weak: number
  due: number
} {
  return {
    total: session.length,
    new: session.filter(w => w.pool === 'new').length,
    weak: session.filter(w => w.pool === 'weak').length,
    due: session.filter(w => w.pool === 'due').length,
  }
}

/**
 * Bilateral session: creates items for both directions
 */
export function createBilateralSession(
  words: Word[],
  links: WordUnitLink[],
  progress: UserWordProgress[],
  config: SessionConfig = DEFAULT_CONFIG
): SessionWord[] {
  // Get pools for both directions
  const enToJp = categorizeWords(words, links, progress, 'en_to_jp')
  const jpToEn = categorizeWords(words, links, progress, 'jp_to_en')

  // Compose sessions for each direction with half the target size
  const halfConfig = {
    ...config,
    maxNewWords: Math.ceil(config.maxNewWords / 2),
    maxWeakWords: Math.ceil(config.maxWeakWords / 2),
    maxDueWords: Math.ceil(config.maxDueWords / 2),
    targetSessionSize: Math.ceil(config.targetSessionSize / 2),
  }

  const enToJpSession = composeSession(enToJp, halfConfig)
  const jpToEnSession = composeSession(jpToEn, halfConfig)

  // Interleave the two directions
  const combined: SessionWord[] = []
  const maxLen = Math.max(enToJpSession.length, jpToEnSession.length)
  
  for (let i = 0; i < maxLen; i++) {
    if (i < enToJpSession.length) combined.push(enToJpSession[i])
    if (i < jpToEnSession.length) combined.push(jpToEnSession[i])
  }

  return combined
}
