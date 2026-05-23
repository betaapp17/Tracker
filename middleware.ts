import { type NextRequest, NextResponse } from 'next/server'

// Edge-compatible middleware: check Supabase auth cookie directly.
// Full session verification happens in server components via createClient().
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.match(/\.(png|ico|svg|jpg|js|css|json)$/)
  ) {
    return NextResponse.next()
  }

  // Supabase stores the session in a cookie named sb-<ref>-auth-token
  // Check any sb-*-auth-token cookie to detect an active session.
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

  // Unauthenticated → login
  if (!hasSession && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated → away from login
  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/inicio', request.url))
  }

  // Authenticated bare / → /inicio
  if (hasSession && pathname === '/') {
    return NextResponse.redirect(new URL('/inicio', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|swe-worker-.*).*)'],
}
