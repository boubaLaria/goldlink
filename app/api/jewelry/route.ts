import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const jewelryCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  images: z.array(z.string()).default([]),
  type: z.enum(['NECKLACE', 'BRACELET', 'RING', 'EARRINGS', 'PENDANT', 'CHAIN']),
  weight: z.number().positive(),
  purity: z.enum(['K8', 'K10', 'K14', 'K18', 'K22', 'K24']),
  estimatedValue: z.number().positive(),
  listingTypes: z.array(z.enum(['RENT', 'SALE', 'EXCHANGE'])).min(1),
  rentPricePerDay: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  location: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const type = searchParams.get('type')
    const purity = searchParams.get('purity')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const ownerId = searchParams.get('ownerId')
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const skip = Number(searchParams.get('skip')) || 0

    // Build filter - when filtering by owner, show all their jewelry; otherwise only available
    const where: any = ownerId ? { ownerId } : { available: true }

    if (type) {
      where.type = type
    }
    if (purity) {
      where.purity = purity
    }
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      }
    }
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Price filter (check both rent and sale prices)
    if (minPrice || maxPrice) {
      where.OR = [
        {
          salePrice: {
            gte: minPrice ? Number(minPrice) : 0,
            lte: maxPrice ? Number(maxPrice) : undefined,
          },
        },
        {
          rentPricePerDay: {
            gte: minPrice ? Number(minPrice) : 0,
            lte: maxPrice ? Number(maxPrice) : undefined,
          },
        },
      ]
    }

    // Fetch with pagination
    const jewelry = await prisma.jewelry.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.jewelry.count({ where })

    return sendJSON({
      data: jewelry,
      pagination: {
        total,
        limit,
        skip,
      },
    })
  } catch (error) {
    console.error('Get jewelry error:', error)
    return sendError('Failed to fetch jewelry', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    // Only sellers and jewelers can create listings
    if (!['SELLER', 'JEWELER', 'ADMIN'].includes(user.role)) {
      return sendError('Only sellers and jewelers can create listings', 403)
    }

    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = jewelryCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const data = result.data

    // Validate pricing based on listing types
    if (data.listingTypes.includes('RENT') && !data.rentPricePerDay) {
      return sendError('Rent price per day is required for rental listings', 400)
    }
    if (data.listingTypes.includes('SALE') && !data.salePrice) {
      return sendError('Sale price is required for sale listings', 400)
    }

    // Create jewelry
    const jewelry = await prisma.jewelry.create({
      data: {
        ...data,
        ownerId: user.id,
        available: true,
      },
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

    return sendJSON(jewelry, 201)
  } catch (error) {
    console.error('Create jewelry error:', error)
    return sendError('Failed to create jewelry listing', 500)
  }
}
