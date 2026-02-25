import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const bookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTE']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        jewelry: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                phone: true,
                rating: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true,
            rating: true,
          },
        },
        transaction: true,
      },
    })

    if (!booking) {
      return sendError('Booking not found', 404)
    }

    // Check ownership - user must be renter, jewelry owner, or admin
    if (booking.renterId !== user.id && booking.jewelry.ownerId !== user.id && user.role !== 'ADMIN') {
      return sendError('Forbidden', 403)
    }

    return sendJSON(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    return sendError('Failed to fetch booking', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { jewelry: { select: { ownerId: true } } },
    })

    if (!booking) {
      return sendError('Booking not found', 404)
    }

    // Only jewelry owner or admin can update status
    if (booking.jewelry.ownerId !== user.id && user.role !== 'ADMIN') {
      return sendError('Only jewelry owner can update booking status', 403)
    }

    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = bookingUpdateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: result.data,
      include: {
        jewelry: true,
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return sendJSON(updated)
  } catch (error) {
    console.error('Update booking error:', error)
    return sendError('Failed to update booking', 500)
  }
}
