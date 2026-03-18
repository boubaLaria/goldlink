import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError } from '@/lib/middleware'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const skip = Number(searchParams.get('skip')) || 0

    const [sessions, total] = await Promise.all([
      prisma.tryOnSession.findMany({
        where: { userId: user.id },
        include: {
          jewelry: {
            select: {
              id: true,
              title: true,
              images: true,
              type: true,
              tryOnType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tryOnSession.count({ where: { userId: user.id } }),
    ])

    return sendJSON({
      data: sessions,
      pagination: { total, limit, skip },
    })
  } catch (error) {
    console.error('TryOn history error:', error)
    return sendError('Failed to fetch try-on history', 500)
  }
}
