import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const messageCreateSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1),
  images: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const skip = Number(searchParams.get('skip')) || 0

    const where: any = {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
    }

    if (conversationId) {
      where.conversationId = conversationId
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        receiver: {
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
      orderBy: { createdAt: 'desc' },
    })

    return sendJSON({
      data: messages,
      pagination: { limit, skip },
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return sendError('Failed to fetch messages', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = messageCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { receiverId, content, images } = result.data

    if (receiverId === user.id) {
      return sendError('Cannot send message to yourself', 400)
    }

    // Get or create conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: [user.id, receiverId].sort()[0],
          user2Id: [user.id, receiverId].sort()[1],
        },
      },
    })

    let conversationId = conversation?.id

    if (!conversationId) {
      const newConversation = await prisma.conversation.create({
        data: {
          user1Id: [user.id, receiverId].sort()[0],
          user2Id: [user.id, receiverId].sort()[1],
        },
      })
      conversationId = newConversation.id
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        conversationId,
        content,
        images,
        status: 'SENT',
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
    })

    // Update conversation's lastMessageId
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageId: message.id },
    })

    return sendJSON(message, 201)
  } catch (error) {
    console.error('Create message error:', error)
    return sendError('Failed to send message', 500)
  }
}
