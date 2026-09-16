import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"

/** Gate the app behind the phone-code session. Unauthenticated visitors are
 * sent to /login; signed-in visitors are bounced off /login back to the app.
 * Auth API routes are always allowed so the login flow itself can run. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const hasSession = req.cookies.has(SESSION_COOKIE)
  const isLogin = pathname === "/login"

  if (!hasSession && !isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (hasSession && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
