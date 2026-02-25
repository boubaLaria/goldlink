import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const reviewCreateSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(['user', 'jewelry']),
  bookingId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('targetId')
    const targetType = searchParams.get('targetType')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const skip = Number(searchParams.get('skip')) || 0

    const where: any = {}

    if (targetId) where.targetId = targetId
    if (targetType) where.targetType = targetType

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
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

    const total = await prisma.review.count({ where })

    return sendJSON({
      data: reviews,
      pagination: { total, limit, skip },
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return sendError('Failed to fetch reviews', 500)
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

    const result = reviewCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { targetId, targetType, bookingId, rating, comment } = result.data

    // Check if target exists
    if (targetType === 'jewelry') {
      const jewelry = await prisma.jewelry.findUnique({ where: { id: targetId } })
      if (!jewelry) {
        return sendError('Jewelry not found', 404)
      }
    } else if (targetType === 'user') {
      const targetUser = await prisma.user.findUnique({ where: { id: targetId } })
      if (!targetUser) {
        return sendError('User not found', 404)
      }
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: user.id,
        targetId,
        targetType,
      },
    })

    if (existingReview) {
      return sendError('You have already reviewed this item', 400)
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        reviewerId: user.id,
        targetId,
        targetType,
        jewelryId: targetType === 'jewelry' ? targetId : undefined,
        targetUserId: targetType === 'user' ? targetId : undefined,
        bookingId,
        rating,
        comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Update target rating
    if (targetType === 'jewelry') {
      const allReviews = await prisma.review.findMany({
        where: { jewelryId: targetId },
      })
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

      await prisma.jewelry.update({
        where: { id: targetId },
        data: {
          rating: avgRating,
          reviewCount: allReviews.length,
        },
      })
    } else if (targetType === 'user') {
      const allReviews = await prisma.review.findMany({
        where: { targetUserId: targetId },
      })
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

      await prisma.user.update({
        where: { id: targetId },
        data: {
          rating: avgRating,
          reviewCount: allReviews.length,
        },
      })
    }

    return sendJSON(review, 201)
  } catch (error) {
    console.error('Create review error:', error)
    return sendError('Failed to create review', 500)
  }
}
