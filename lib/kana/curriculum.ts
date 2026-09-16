import { UNITS } from "./data"
import type { Unit } from "./types"

export type StageKind =
  | "basic"
  | "variation"
  | "mixed"
  | "reverse"
  | "review"
  | "combos"

export interface Stage {
  id: string
  unitId: string
  index: number
  kind: StageKind
  title: string
  subtitle: string
  direction: "forward" | "reverse"
}

const KIND_META: Record<StageKind, { title: string; subtitle: string }> = {
  basic: { title: "Basic matching", subtitle: "Learn the row" },
  variation: { title: "Variation", subtitle: "Voiced & semi-voiced" },
  mixed: { title: "Mixed row", subtitle: "Base + variations" },
  reverse: { title: "Reverse matching", subtitle: "Kana to sound" },
  review: { title: "Review", subtitle: "Mix with earlier rows" },
  combos: { title: "Combination sounds", subtitle: "Contracted kana" },
}

export function getStages(unit: Unit): Stage[] {
  const kinds: StageKind[] = ["basic"]
  if (unit.variations.length > 0) {
    kinds.push("variation", "mixed")
  }
  kinds.push("reverse", "review")
  if (unit.combos.length > 0) {
    kinds.push("combos")
  }

  return kinds.map((kind, index) => ({
    id: `${unit.id}:${kind}`,
    unitId: unit.id,
    index,
    kind,
    title: KIND_META[kind].title,
    subtitle: KIND_META[kind].subtitle,
    direction: kind === "reverse" ? "reverse" : "forward",
  }))
}

/** The kana this unit "teaches" — used for mastery gating. */
export function unitTargetKana(unit: Unit): string[] {
  return [...unit.base, ...unit.variations.flat()]
}

/** Base kana ids for the stage (review is augmented at runtime). */
export function stageOwnKana(stage: Stage, unit: Unit): string[] {
  switch (stage.kind) {
    case "basic":
      return unit.base
    case "variation":
      return unit.variations.flat()
    case "mixed":
      return [...unit.base, ...unit.variations.flat()]
    case "reverse":
      return [...unit.base, ...unit.variations.flat()]
    case "review":
      return [...unit.base, ...unit.variations.flat()]
    case "combos":
      return unit.combos
  }
}

export function unitIndex(unitId: string): number {
  return UNITS.findIndex((u) => u.id === unitId)
}
