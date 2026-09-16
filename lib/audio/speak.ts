/**
 * Plays Japanese pronunciation for a short string via the TTS proxy.
 * Fetched clips are cached as object URLs for the session so replays and
 * repeated kana are instant and hit the network only once.
 */

const urlCache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()
let current: HTMLAudioElement | null = null

async function fetchClip(text: string): Promise<string> {
  const cached = urlCache.get(text)
  if (cached) return cached

  const pending = inflight.get(text)
  if (pending) return pending

  const load = (async () => {
    const res = await fetch(`/api/tts?q=${encodeURIComponent(text)}`)
    if (!res.ok) throw new Error(`TTS ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    urlCache.set(text, objectUrl)
    inflight.delete(text)
    return objectUrl
  })().catch((err) => {
    inflight.delete(text)
    throw err
  })

  inflight.set(text, load)
  return load
}

/** Play the pronunciation for `text`. Resolves once playback starts. */
export async function speak(text: string): Promise<void> {
  const value = text.trim()
  if (!value) return
  try {
    const objectUrl = await fetchClip(value)
    if (current) {
      current.pause()
      current.currentTime = 0
    }
    const audio = new Audio(objectUrl)
    current = audio
    await audio.play()
  } catch {
    // Network/playback failures are non-fatal — stay silent for the learner.
  }
}

/** Warm the cache without playing, e.g. before a round starts. */
export function prefetchSpeak(text: string): void {
  const value = text.trim()
  if (!value) return
  void fetchClip(value).catch(() => {})
}
