import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, extractTokenFromHeader } from './auth'
import prisma from './db'

export interface AuthenticatedRequest extends NextRequest {
  userId?: string
  user?: {
    id: string
    email: string
    [key: string]: any
  }
}

/**
 * Middleware to authenticate requests via JWT token
 * Adds userId and user object to request
 */
export async function authenticate(request: NextRequest) {
  const token = extractTokenFromHeader(request.headers.get('authorization'))

  if (!token) {
    return null
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return null
  }

  // Fetch full user object from DB
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    return user
  } catch {
    return null
  }
}

/**
 * Wrapper for protected API routes
 * Returns 401 if not authenticated
 */
export function withAuth(
  handler: (req: NextRequest, { user }: { user: any }) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    const user = await authenticate(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, { user })
  }
}

/**
 * Wrapper for admin-only routes
 */
export function withAdminAuth(
  handler: (req: NextRequest, { user }: { user: any }) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    const user = await authenticate(req)

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return handler(req, { user })
  }
}

/**
 * Wrapper for role-restricted routes
 * Usage: withRoles(['SELLER', 'JEWELER', 'ADMIN'], handler)
 */
export function withRoles(
  roles: string[],
  handler: (req: NextRequest, { user }: { user: any }) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    const user = await authenticate(req)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: `Access restricted. Required role: ${roles.join(' or ')}` },
        { status: 403 }
      )
    }

    return handler(req, { user })
  }
}

/**
 * Parse JSON body safely
 */
export async function parseJSON(request: NextRequest) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/**
 * Send JSON response with status
 */
export function sendJSON(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Send error response
 */
export function sendError(message: string, status = 400) {
  return sendJSON({ error: message }, status)
}
