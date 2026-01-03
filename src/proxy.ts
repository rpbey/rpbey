import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/admin']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/sign-in', '/sign-up']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session token from cookies (check both secure and non-secure)
  const sessionToken = request.cookies.get('better-auth.session_token')?.value || 
                       request.cookies.get('__Secure-better-auth.session_token')?.value

  // Check if user is authenticated
  const isAuthenticated = !!sessionToken

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to sign-in for protected routes
  if (!isAuthenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
