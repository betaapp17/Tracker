import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, INACTIVITY_TIMEOUT_MS } from '@/lib/session'
import type { SessionData } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.loggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Expire session after inactivity
  const now = Date.now()
  if (session.lastActivity && now - session.lastActivity > INACTIVITY_TIMEOUT_MS) {
    const redirect = NextResponse.redirect(new URL('/login', request.url))
    redirect.cookies.delete('tq-session')
    return redirect
  }

  // Only write the cookie when lastActivity is stale (>30s).
  // This avoids re-encrypting and sending Set-Cookie on every request,
  // which is the main source of server overload when multiple users are active.
  if (!session.lastActivity || now - session.lastActivity > 30_000) {
    session.lastActivity = now
    await session.save()
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|app-version.json|sw.js|swe-worker|workbox).*)',
  ],
}
