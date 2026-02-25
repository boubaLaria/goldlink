import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const bookingCreateSchema = z.object({
  jewelryId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  insurance: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const skip = Number(searchParams.get('skip')) || 0

    // ADMIN sees all bookings; others see only their own
    const where: any = user.role === 'ADMIN'
      ? {}
      : {
          OR: [
            { renterId: user.id },
            { jewelry: { ownerId: user.id } },
          ],
        }

    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        jewelry: {
          select: {
            id: true,
            title: true,
            images: true,
            type: true,
            location: true,
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        owner: {
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

    const total = await prisma.booking.count({ where })

    return sendJSON({
      data: bookings,
      pagination: { total, limit, skip },
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    return sendError('Failed to fetch bookings', 500)
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

    const result = bookingCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { jewelryId, startDate, endDate, insurance } = result.data

    // Get jewelry
    const jewelry = await prisma.jewelry.findUnique({
      where: { id: jewelryId },
    })

    if (!jewelry) {
      return sendError('Jewelry not found', 404)
    }

    if (!jewelry.available) {
      return sendError('Jewelry is not available', 400)
    }

    if (!jewelry.listingTypes.includes('RENT')) {
      return sendError('This jewelry is not available for rent', 400)
    }

    // Calculate days and price
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (days < 1) {
      return sendError('End date must be after start date', 400)
    }

    const totalPrice = (jewelry.rentPricePerDay || 0) * days
    const deposit = totalPrice * 0.2 // 20% deposit

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        jewelryId,
        renterId: user.id,
        ownerId: jewelry.ownerId,
        startDate: start,
        endDate: end,
        totalPrice,
        deposit,
        insurance,
        status: 'PENDING',
      },
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

    return sendJSON(booking, 201)
  } catch (error) {
    console.error('Create booking error:', error)
    return sendError('Failed to create booking', 500)
  }
}
