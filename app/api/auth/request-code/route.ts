import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePhone } from "@/lib/auth/phone"

/** Step 1 of login: confirm a profile exists for the given phone number.
 * No SMS is sent — the code is a fixed dev code — so this just validates the
 * number and greets the user by name. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const digits = normalizePhone(body?.phone ?? "")
  if (!digits) {
    return NextResponse.json({ error: "Enter a phone number." }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("kana_profiles")
    .select("name")
    .eq("phone", digits)
    .maybeSingle()

  if (!data) {
    return NextResponse.json(
      { error: "No account found for that number." },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true, name: data.name })
}
