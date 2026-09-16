import { type NextRequest, NextResponse } from "next/server"

/**
 * Proxies Google Translate's TTS endpoint for a short Japanese string.
 * A direct browser call is blocked by CORS, so we fetch server-side and
 * stream the MP3 back. Kana/word audio never changes, so we cache hard.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 })
  }
  // Google's TTS endpoint caps input length; our clips are single words.
  if (q.length > 60) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 })
  }

  const url =
    "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja" +
    `&q=${encodeURIComponent(q)}&total=1&idx=0&textlen=${q.length}`

  try {
    const upstream = await fetch(url, {
      headers: {
        // Google rejects requests without a browser-like User-Agent.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
      cache: "no-store",
    })

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "TTS upstream failed" }, { status: 502 })
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        // Immutable per phrase — safe to cache aggressively.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json({ error: "TTS request error" }, { status: 502 })
  }
}
