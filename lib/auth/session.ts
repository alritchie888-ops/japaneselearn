import { cookies } from "next/headers"
import { SESSION_COOKIE } from "./constants"

/** Read the signed-in profile slug from the session cookie, if any. */
export async function getSessionSlug(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}
