import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightweight middleware: only checks for presence of the auth cookie.
// Full token verification happens in server-side API routes using the Firebase Admin SDK
// because the Edge runtime (middleware) doesn't support native Node modules used by firebase-admin.

const PUBLIC_PATHS = ['/login', '/api/']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('nainiii_token')?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Match all pages except static files and _next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
