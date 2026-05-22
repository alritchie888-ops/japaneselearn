/**
 * Script Scaffold Manager
 * Handles per-word, per-learner script display progression
 * 
 * Levels:
 * 0 = Romaji only (coffee)
 * 1 = Hiragana/Katakana (コーヒー)
 * 2 = Kanji with furigana (珈琲 with reading)
 * 3 = Kanji only (珈琲)
 */

import type { Word, ScriptLevel, ScriptDisplay } from './types'

export interface ScaffoldConfig {
  userScriptIntention: number // 0-100, user's target level
  wordScriptLevel: ScriptLevel // current level for this specific word
  direction: 'en_to_jp' | 'jp_to_en'
}

/**
 * Get the display representation of a word based on scaffold level
 */
export function getWordDisplay(word: Word, config: ScaffoldConfig): ScriptDisplay {
  const { wordScriptLevel, direction } = config
  
  // For JP→EN direction, we show Japanese and expect English
  // For EN→JP direction, we show English and expect Japanese
  
  const full = {
    kanji: word.kanji,
    hiragana: word.hiragana,
    katakana: word.katakana,
    romaji: word.romaji
  }
  
  if (direction === 'en_to_jp') {
    // Showing English, user produces Japanese
    return {
      primary: word.meaning_en,
      full
    }
  }
  
  // JP→EN: showing Japanese based on script level
  switch (wordScriptLevel) {
    case 0: // Romaji only
      return {
        primary: word.romaji,
        full
      }
    
    case 1: // Kana (prefer katakana for loanwords)
      return {
        primary: word.katakana || word.hiragana,
        secondary: word.romaji, // Show romaji as helper
        full
      }
    
    case 2: // Kanji with furigana
      if (word.kanji) {
        return {
          primary: word.kanji,
          secondary: word.hiragana, // Furigana reading
          full
        }
      }
      // Fallback to kana if no kanji
      return {
        primary: word.katakana || word.hiragana,
        full
      }
    
    case 3: // Kanji only
      return {
        primary: word.kanji || word.katakana || word.hiragana,
        full
      }
    
    default:
      return {
        primary: word.romaji,
        full
      }
  }
}

/**
 * Determine initial script level based on user's script intention
 */
export function getInitialScriptLevel(scriptIntention: number): ScriptLevel {
  // 0-25: Start with romaji
  // 26-50: Start with kana
  // 51-75: Start with furigana
  // 76-100: Start with kanji
  
  if (scriptIntention <= 25) return 0
  if (scriptIntention <= 50) return 1
  if (scriptIntention <= 75) return 2
  return 3
}

/**
 * Determine if a word should level up its script display
 * Based on consecutive correct answers at current level
 */
export function shouldLevelUp(
  currentLevel: ScriptLevel,
  consecutiveCorrect: number,
  userScriptIntention: number
): boolean {
  if (currentLevel >= 3) return false
  
  // Calculate target level from intention
  const targetLevel = getInitialScriptLevel(userScriptIntention)
  
  // Don't level up beyond user's target
  if (currentLevel >= targetLevel) return false
  
  // Require more correct answers for each level
  const requiredCorrect = [3, 4, 5][currentLevel] // 0→1: 3, 1→2: 4, 2→3: 5
  
  return consecutiveCorrect >= requiredCorrect
}

/**
 * Get the expected answer format based on script level and direction
 */
export function getExpectedAnswerFormat(
  word: Word,
  scriptLevel: ScriptLevel,
  direction: 'en_to_jp' | 'jp_to_en'
): string[] {
  if (direction === 'jp_to_en') {
    // Accept English meaning and alternatives
    const answers = [word.meaning_en.toLowerCase()]
    if (word.meaning_en_alt) {
      answers.push(...word.meaning_en_alt.map(a => a.toLowerCase()))
    }
    return answers
  }
  
  // EN→JP: Accept based on script level
  const answers: string[] = []
  
  // Always accept romaji
  answers.push(word.romaji.toLowerCase())
  
  // Accept kana at level 1+
  if (scriptLevel >= 1) {
    answers.push(word.hiragana)
    if (word.katakana) answers.push(word.katakana)
  }
  
  // Accept kanji at level 2+
  if (scriptLevel >= 2 && word.kanji) {
    answers.push(word.kanji)
  }
  
  return answers
}

/**
 * Check if user's answer is correct
 */
export function checkAnswer(
  userAnswer: string,
  word: Word,
  scriptLevel: ScriptLevel,
  direction: 'en_to_jp' | 'jp_to_en'
): { correct: boolean; closestMatch?: string } {
  const trimmedAnswer = userAnswer.trim().toLowerCase()
  const acceptedAnswers = getExpectedAnswerFormat(word, scriptLevel, direction)
  
  // Exact match
  if (acceptedAnswers.some(a => a.toLowerCase() === trimmedAnswer)) {
    return { correct: true }
  }
  
  // For Japanese input, also check without normalization issues
  if (direction === 'en_to_jp') {
    // Normalize Japanese text (full-width/half-width, etc.)
    const normalizedAnswer = normalizeJapanese(trimmedAnswer)
    if (acceptedAnswers.some(a => normalizeJapanese(a) === normalizedAnswer)) {
      return { correct: true }
    }
  }
  
  // Find closest match for feedback
  const closestMatch = acceptedAnswers[0]
  
  return { correct: false, closestMatch }
}

/**
 * Normalize Japanese text for comparison
 */
function normalizeJapanese(text: string): string {
  return text
    // Convert full-width alphanumeric to half-width
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => 
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    )
    // Convert half-width katakana to full-width
    .normalize('NFKC')
    .toLowerCase()
}

/**
 * Render Japanese text with furigana (for display)
 */
export function renderWithFurigana(kanji: string, reading: string): string {
  // Returns HTML ruby annotation
  return `<ruby>${kanji}<rp>(</rp><rt>${reading}</rt><rp>)</rp></ruby>`
}
