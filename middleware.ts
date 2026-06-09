import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect all /admin/* routes except the login page itself
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const cookie = req.cookies.get('admin_session')
    if (!cookie) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
