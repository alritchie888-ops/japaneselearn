import { createServerClient } from "@supabase/ssr"

/**
 * Service-role Supabase client for server-only auth work (looking up a
 * profile by phone). Bypasses RLS, so it must never be imported into client
 * code. No cookies are needed — it performs no user session work.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        /* no-op: admin client holds no user session */
      },
    },
  })
}
