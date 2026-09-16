"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { applyResult, emptyStat, type KanaStat } from "./mastery"
import { PROFILES, loadProgress, saveProgress, type Profile } from "./profiles"
import type { RomajiMode } from "@/lib/practical/types"

const SCHEMA_VERSION = 2

export interface SpeedRecord {
  timeMs: number
  accuracy: number
  avgMs: number
  mistakes: number
  at: number
}

export interface Settings {
  /** How aggressively romaji is shown as a learning aid. */
  romaji: RomajiMode
}

export interface ProgressState {
  version: number
  stats: Record<string, KanaStat>
  completedStages: string[]
  sessionsCompleted: number
  streak: { count: number; lastActive: string }
  /** key `${count}` -> best record */
  bestSpeed: Record<string, SpeedRecord>
  /** kanaId -> confusedWithId -> count */
  confusions: Record<string, Record<string, number>>
  lastUnitId: string | null
  settings: Settings
}

const DEFAULT_SETTINGS: Settings = { romaji: "fade" }

function initialState(): ProgressState {
  return {
    version: SCHEMA_VERSION,
    stats: {},
    completedStages: [],
    sessionsCompleted: 0,
    streak: { count: 0, lastActive: "" },
    bestSpeed: {},
    confusions: {},
    lastUnitId: null,
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** Bring any older persisted blob up to the current schema shape. */
function migrate(loaded: Partial<ProgressState> | null): ProgressState {
  const base = initialState()
  if (!loaded) return base
  return {
    ...base,
    ...loaded,
    settings: { ...DEFAULT_SETTINGS, ...(loaded.settings ?? {}) },
    version: SCHEMA_VERSION,
  }
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime()
  const db = new Date(b + "T00:00:00Z").getTime()
  return Math.round((db - da) / (24 * 60 * 60 * 1000))
}

interface ProgressContextValue {
  state: ProgressState
  hydrated: boolean
  saving: boolean
  activeProfile: Profile
  recordAnswer: (
    kanaId: string,
    correct: boolean,
    opts?: { confusedWith?: string },
  ) => void
  completeStage: (stageId: string) => void
  completeSession: () => void
  recordSpeed: (count: number | string, record: Omit<SpeedRecord, "at">) => boolean
  setLastUnit: (unitId: string) => void
  setRomajiMode: (mode: RomajiMode) => void
  reset: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({
  children,
  initialSlug,
}: {
  children: React.ReactNode
  initialSlug: string
}) {
  const [state, setState] = useState<ProgressState>(initialState)
  const [activeSlug] = useState<string>(
    () => (PROFILES.some((p) => p.slug === initialSlug) ? initialSlug : PROFILES[0].slug),
  )
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state
  // Guards saving during the load window so a fresh load never echoes back.
  const loadedSlugRef = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the active profile's progress from Supabase whenever it changes.
  useEffect(() => {
    let cancelled = false
    setHydrated(false)
    loadedSlugRef.current = null
    loadProgress(activeSlug).then((loaded) => {
      if (cancelled) return
      setState(migrate(loaded as Partial<ProgressState> | null))
      loadedSlugRef.current = activeSlug
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [activeSlug])

  // Debounced save to Supabase after local changes settle.
  useEffect(() => {
    if (!hydrated || loadedSlugRef.current !== activeSlug) return
    setSaving(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await saveProgress(activeSlug, stateRef.current)
      setSaving(false)
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, hydrated, activeSlug])

  const recordAnswer = useCallback<ProgressContextValue["recordAnswer"]>(
    (kanaId, correct, opts) => {
      setState((prev) => {
        const nextStat = applyResult(prev.stats[kanaId], correct)
        const confusions = prev.confusions
        let nextConfusions = confusions
        if (!correct && opts?.confusedWith) {
          const inner = { ...(confusions[kanaId] ?? {}) }
          inner[opts.confusedWith] = (inner[opts.confusedWith] ?? 0) + 1
          nextConfusions = { ...confusions, [kanaId]: inner }
        }
        return {
          ...prev,
          stats: { ...prev.stats, [kanaId]: nextStat },
          confusions: nextConfusions,
        }
      })
    },
    [],
  )

  const completeStage = useCallback((stageId: string) => {
    setState((prev) =>
      prev.completedStages.includes(stageId)
        ? prev
        : { ...prev, completedStages: [...prev.completedStages, stageId] },
    )
  }, [])

  const completeSession = useCallback(() => {
    setState((prev) => {
      const today = todayKey()
      let count = prev.streak.count
      if (prev.streak.lastActive === today) {
        // already counted today
      } else if (prev.streak.lastActive && daysBetween(prev.streak.lastActive, today) === 1) {
        count += 1
      } else {
        count = 1
      }
      return {
        ...prev,
        sessionsCompleted: prev.sessionsCompleted + 1,
        streak: { count, lastActive: today },
      }
    })
  }, [])

  const recordSpeed = useCallback<ProgressContextValue["recordSpeed"]>(
    (count, record) => {
      const key = String(count)
      const existing = stateRef.current.bestSpeed[key]
      const isBest = !existing || record.timeMs < existing.timeMs
      setState((prev) => {
        const prevBest = prev.bestSpeed[key]
        if (prevBest && record.timeMs >= prevBest.timeMs) return prev
        return {
          ...prev,
          bestSpeed: { ...prev.bestSpeed, [key]: { ...record, at: Date.now() } },
        }
      })
      return isBest
    },
    [],
  )

  const setLastUnit = useCallback((unitId: string) => {
    setState((prev) => (prev.lastUnitId === unitId ? prev : { ...prev, lastUnitId: unitId }))
  }, [])

  const setRomajiMode = useCallback((mode: RomajiMode) => {
    setState((prev) =>
      prev.settings.romaji === mode
        ? prev
        : { ...prev, settings: { ...prev.settings, romaji: mode } },
    )
  }, [])

  const reset = useCallback(
    () =>
      setState((prev) => ({ ...initialState(), settings: prev.settings })),
    [],
  )

  const activeProfile = useMemo(
    () => PROFILES.find((p) => p.slug === activeSlug) ?? PROFILES[0],
    [activeSlug],
  )

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      hydrated,
      saving,
      activeProfile,
      recordAnswer,
      completeStage,
      completeSession,
      recordSpeed,
      setLastUnit,
      setRomajiMode,
      reset,
    }),
    [
      state,
      hydrated,
      saving,
      activeProfile,
      recordAnswer,
      completeStage,
      completeSession,
      recordSpeed,
      setLastUnit,
      setRomajiMode,
      reset,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider")
  return ctx
}

export { emptyStat }
export type { KanaStat }
