import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const skip = Number(searchParams.get('skip')) || 0

    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        receiverId: user.id,
        status: 'SENT',
      },
      data: { status: 'READ' },
    })

    return sendJSON({
      data: messages,
      pagination: { limit, skip },
    })
  } catch (error) {
    console.error('Get conversation messages error:', error)
    return sendError('Failed to fetch messages', 500)
  }
}
