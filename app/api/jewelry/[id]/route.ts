import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const jewelryUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  images: z.array(z.string()).optional(),
  weight: z.number().positive().optional(),
  purity: z.enum(['K8', 'K10', 'K14', 'K18', 'K22', 'K24']).optional(),
  estimatedValue: z.number().positive().optional(),
  listingTypes: z.array(z.enum(['RENT', 'SALE', 'EXCHANGE'])).optional(),
  rentPricePerDay: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  location: z.string().min(1).optional(),
  available: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const jewelry = await prisma.jewelry.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
            verified: true,
          },
        },
        reviews: {
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
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!jewelry) {
      return sendError('Jewelry not found', 404)
    }

    // Increment view count
    await prisma.jewelry.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return sendJSON(jewelry)
  } catch (error) {
    console.error('Get jewelry detail error:', error)
    return sendError('Failed to fetch jewelry', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const user = await authenticate(request)

    if (!user) {
      return sendError('Unauthorized', 401)
    }

    // Check ownership
    const jewelry = await prisma.jewelry.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!jewelry) {
      return sendError('Jewelry not found', 404)
    }

    if (jewelry.ownerId !== user.id && user.role !== 'ADMIN') {
      return sendError('Forbidden', 403)
    }

    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = jewelryUpdateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const data = result.data

    // Update jewelry
    const updated = await prisma.jewelry.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
      },
    })

    return sendJSON(updated)
  } catch (error) {
    console.error('Update jewelry error:', error)
    return sendError('Failed to update jewelry', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const user = await authenticate(request)

    if (!user) {
      return sendError('Unauthorized', 401)
    }

    // Check ownership
    const jewelry = await prisma.jewelry.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!jewelry) {
      return sendError('Jewelry not found', 404)
    }

    if (jewelry.ownerId !== user.id && user.role !== 'ADMIN') {
      return sendError('Forbidden', 403)
    }

    // Delete jewelry
    await prisma.jewelry.delete({
      where: { id },
    })

    return sendJSON({ success: true })
  } catch (error) {
    console.error('Delete jewelry error:', error)
    return sendError('Failed to delete jewelry', 500)
  }
}
