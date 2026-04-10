import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-prod'
)

// Routes qui nécessitent une authentification
const PROTECTED = [
  '/dashboard',
  '/settings',
  '/messages',
  '/jewelry/new',
  '/admin',
  '/estimation',
]

// Préfixes protégés (ex: /jewelry/abc/edit)
const PROTECTED_PATTERNS = [
  /^\/jewelry\/[^/]+\/edit$/,
  /^\/booking\/.+$/,
  /^\/dashboard\/.+$/,
]

function isProtected(pathname: string) {
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  return PROTECTED_PATTERNS.some(r => r.test(pathname))
}

async function getUser(token: string | undefined) {
  if (!token) return null
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const isAuth = await getUser(token)

  // Non connecté → redirige vers /login avec ?from=
  if (!isAuth && isProtected(pathname)) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
