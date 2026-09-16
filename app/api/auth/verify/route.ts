import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePhone } from "@/lib/auth/phone"
import { DEV_CODES } from "@/lib/auth/codes"
import { SESSION_COOKIE } from "@/lib/auth/constants"

/** Step 2 of login: verify the fixed dev code for the profile matching the
 * phone number, then set the session cookie. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const digits = normalizePhone(body?.phone ?? "")
  const code = String(body?.code ?? "").trim()

  if (!digits || !code) {
    return NextResponse.json(
      { error: "Enter your phone number and code." },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("kana_profiles")
    .select("slug, name")
    .eq("phone", digits)
    .maybeSingle()

  if (!data) {
    return NextResponse.json(
      { error: "No account found for that number." },
      { status: 404 },
    )
  }

  const expected = DEV_CODES[data.slug]
  if (!expected || code !== expected) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 401 })
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, data.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ ok: true, slug: data.slug, name: data.name })
}
