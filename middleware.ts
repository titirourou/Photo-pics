import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
    // If trying to access admin route but not an admin
    if (isAdminRoute && !req.nextauth.token?.isAdmin) {
      return NextResponse.redirect(new URL('/user', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/user/:path*']
}; 