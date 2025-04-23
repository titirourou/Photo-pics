import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userType = request.cookies.get('user_type')?.value

  // Public paths that don't require authentication
  const publicPaths = ['/', '/admin/login', '/user/login']
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Check admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (userType !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Check user routes
  if (request.nextUrl.pathname.startsWith('/user')) {
    if (userType !== 'user') {
      return NextResponse.redirect(new URL('/user/login', request.url))
    }
    return NextResponse.next()
  }

  // Default redirect to home page
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 