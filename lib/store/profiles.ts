import { createClient } from "@/lib/supabase/client"
import type { ProgressState } from "./progress"

export interface Profile {
  slug: string
  name: string
}

/** Fixed test profiles seeded in the database. */
export const PROFILES: Profile[] = [
  { slug: "alistair", name: "Alistair" },
  { slug: "xu-er", name: "Xu Er" },
]

/** Load a profile's saved progress blob, or null if none stored yet. */
export async function loadProgress(slug: string): Promise<ProgressState | null> {
  const supabase = createClient()
  const { data: profile, error: pErr } = await supabase
    .from("kana_profiles")
    .select("id")
    .eq("slug", slug)
    .single()

  if (pErr || !profile) {
    console.log("[v0] loadProgress: profile lookup failed", pErr?.message)
    return null
  }

  const { data: row, error: rErr } = await supabase
    .from("kana_progress")
    .select("data")
    .eq("profile_id", profile.id)
    .maybeSingle()

  if (rErr) {
    console.log("[v0] loadProgress: progress fetch failed", rErr.message)
    return null
  }

  const blob = row?.data as ProgressState | undefined
  if (!blob || typeof blob !== "object" || !("version" in blob)) return null
  return blob
}

/** Persist a profile's progress blob (upsert). */
export async function saveProgress(slug: string, state: ProgressState): Promise<void> {
  const supabase = createClient()
  const { data: profile, error: pErr } = await supabase
    .from("kana_profiles")
    .select("id")
    .eq("slug", slug)
    .single()

  if (pErr || !profile) {
    console.log("[v0] saveProgress: profile lookup failed", pErr?.message)
    return
  }

  const { error } = await supabase
    .from("kana_progress")
    .upsert(
      { profile_id: profile.id, data: state, updated_at: new Date().toISOString() },
      { onConflict: "profile_id" },
    )

  if (error) console.log("[v0] saveProgress: upsert failed", error.message)
}
