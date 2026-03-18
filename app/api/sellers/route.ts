import { NextRequest } from 'next/server'
import { sendJSON, sendError } from '@/lib/middleware'
import prisma from '@/lib/db'

// GET /api/sellers — public list of SELLER and JEWELER users
export async function GET(_request: NextRequest) {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        role: { in: ['SELLER', 'JEWELER'] },
        verified: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        verified: true,
        rating: true,
        address: true,
        country: true,
        _count: {
          select: { ownedJewelry: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    return sendJSON({ data: sellers })
  } catch (error) {
    console.error('Get sellers error:', error)
    return sendError('Failed to fetch sellers', 500)
  }
}
