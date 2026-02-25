import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError } from '@/lib/middleware'
import prisma from '@/lib/db'

// GET /api/users — list all users (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)
    if (user.role !== 'ADMIN') return sendError('Admin access required', 403)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verified: true,
        country: true,
        currency: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        _count: {
          select: { ownedJewelry: true, rentalBookingsAsRenter: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return sendJSON({ data: users })
  } catch (error) {
    console.error('Get users error:', error)
    return sendError('Failed to fetch users', 500)
  }
}
