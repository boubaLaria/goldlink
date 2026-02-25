import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const estimationCreateSchema = z.object({
  images: z.array(z.string()).default([]),
  weight: z.number().positive(),
  purity: z.enum(['K8', 'K10', 'K14', 'K18', 'K22', 'K24']),
})

// Gold prices per gram (MAD)
const GOLD_PRICES: Record<string, number> = {
  K8: 150,
  K10: 200,
  K14: 280,
  K18: 450,
  K22: 550,
  K24: 600,
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const skip = Number(searchParams.get('skip')) || 0

    const estimations = await prisma.estimation.findMany({
      where: { userId: user.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.estimation.count({ where: { userId: user.id } })

    return sendJSON({
      data: estimations,
      pagination: { total, limit, skip },
    })
  } catch (error) {
    console.error('Get estimations error:', error)
    return sendError('Failed to fetch estimations', 500)
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

    const result = estimationCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { images, weight, purity } = result.data

    // Calculate gold value
    const goldPrice = GOLD_PRICES[purity]
    const estimatedGoldValue = weight * goldPrice

    // Calculate commercial value with markup (40% markup)
    const estimatedCommercialValue = estimatedGoldValue * 1.4

    // Calculate confidence based on images
    const confidence = images.length > 0 ? 0.95 : 0.7

    // Create estimation
    const estimation = await prisma.estimation.create({
      data: {
        userId: user.id,
        images,
        weight,
        purity,
        estimatedGoldValue,
        estimatedCommercialValue,
        confidence,
        certified: false,
      },
    })

    return sendJSON(estimation, 201)
  } catch (error) {
    console.error('Create estimation error:', error)
    return sendError('Failed to create estimation', 500)
  }
}
