// =============================================
// Database Types for Japanese Learning App
// =============================================

export type ScriptLevel = 0 | 1 | 2 | 3 // 0=romaji, 1=hiragana, 2=furigana, 3=kanji
export type Direction = 'en_to_jp' | 'jp_to_en'
export type CardState = 'new' | 'learning' | 'review' | 'relearning'
export type LearningPattern = 'closed_set' | 'rule_exceptions' | 'rule_production' | 'open_contextual'
export type SessionType = 'intro' | 'drill' | 'scenario' | 'voice' | 'review'
export type PriorExperience = 'none' | 'some_exposure' | 'studied_before' | 'lived_in_japan'

// =============================================
// Database Row Types
// =============================================

export interface Profile {
  id: string
  display_name: string | null
  native_language: string
  script_intention: number // 0-100
  prior_japanese_experience: PriorExperience | null
  learning_goal: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  slug: string
  title_en: string
  title_ja: string | null
  description: string | null
  icon: string | null
  difficulty_level: number
  estimated_hours: number | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Unit {
  id: string
  topic_id: string
  slug: string
  title_en: string
  title_ja: string | null
  can_do_statement: string
  learning_pattern: LearningPattern
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Word {
  id: string
  kanji: string | null
  hiragana: string
  katakana: string | null
  romaji: string
  meaning_en: string
  meaning_en_alt: string[] | null
  part_of_speech: string | null
  jlpt_level: number | null
  frequency_rank: number | null
  notes: string | null
  audio_url: string | null
  created_at: string
}

export interface WordUnitLink {
  id: string
  word_id: string
  unit_id: string
  sort_order: number
  context_sentence_ja: string | null
  context_sentence_en: string | null
}

export interface Sentence {
  id: string
  unit_id: string
  japanese: string
  english: string
  romaji: string | null
  notes: string | null
  audio_url: string | null
  sort_order: number
  created_at: string
}

export interface Scenario {
  id: string
  unit_id: string
  title: string
  description: string | null
  setting: string | null
  system_prompt: string | null
  difficulty_level: number
  expected_vocabulary: string[] | null
  is_ai_generated: boolean
  created_at: string
}

export interface UserWordProgress {
  id: string
  user_id: string
  word_id: string
  direction: Direction
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: CardState
  last_review: string | null
  next_review: string | null
  script_level: ScriptLevel
  created_at: string
  updated_at: string
}

export interface UserUnitProgress {
  id: string
  user_id: string
  unit_id: string
  completed_steps: string[]
  intro_completed: boolean
  drill_completed: boolean
  scenario_completed: boolean
  voice_completed: boolean
  started_at: string | null
  completed_at: string | null
  mastery_percentage: number
  created_at: string
  updated_at: string
}

export interface UserTopicProgress {
  id: string
  user_id: string
  topic_id: string
  started_at: string | null
  completed_at: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface LearningSession {
  id: string
  user_id: string
  unit_id: string | null
  session_type: SessionType
  started_at: string
  ended_at: string | null
  words_practiced: number
  correct_count: number
  incorrect_count: number
  session_data: Record<string, unknown>
}

// =============================================
// Extended Types with Relations
// =============================================

export interface WordWithProgress extends Word {
  progress?: UserWordProgress
}

export interface UnitWithWords extends Unit {
  words: WordWithProgress[]
  sentences: Sentence[]
  scenarios: Scenario[]
}

export interface TopicWithUnits extends Topic {
  units: Unit[]
  progress?: UserTopicProgress
}

// =============================================
// Drill Types
// =============================================

export interface DrillCard {
  word: Word
  direction: Direction
  progress: UserWordProgress | null
  scriptLevel: ScriptLevel
}

export type DrillResponse = 'again' | 'hard' | 'good' | 'easy'

export interface DrillResult {
  card: DrillCard
  response: DrillResponse
  responseTime: number // milliseconds
  userAnswer?: string
}

// =============================================
// Checklist Types
// =============================================

export interface ChecklistStep {
  id: string
  type: 'intro' | 'vocabulary' | 'grammar' | 'drill' | 'scenario' | 'voice' | 'review'
  title: string
  description?: string
  isCompleted: boolean
  isLocked: boolean
}

// =============================================
// Script Scaffold Types
// =============================================

export interface ScriptDisplay {
  primary: string // What to show prominently
  secondary?: string // Furigana or romanization
  full: {
    kanji: string | null
    hiragana: string
    katakana: string | null
    romaji: string
  }
}

// =============================================
// FSRS Parameters
// =============================================

export interface FSRSParameters {
  requestRetention: number
  maximumInterval: number
  w: number[] // 19 parameters
}

export const DEFAULT_FSRS_PARAMETERS: FSRSParameters = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616,
    0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567
  ]
}
