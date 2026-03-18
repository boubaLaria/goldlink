import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const updateMeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  country: z.string().max(50).optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'MAD', 'AED', 'SAR']).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)

    const body = await parseJSON(request)
    if (!body) return sendError('Invalid request body', 400)

    const result = updateMeSchema.safeParse(body)
    if (!result.success) return sendError(result.error.errors[0].message, 400)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: result.data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, avatar: true, verified: true, rating: true,
        address: true, phone: true, cin: true, country: true, currency: true,
      },
    })

    return sendJSON({ data: updated })
  } catch (error) {
    console.error('Update me error:', error)
    return sendError('Failed to update profile', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)

    if (!user) {
      return sendError('Unauthorized', 401)
    }

    return sendJSON({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified,
      rating: user.rating,
      address: user.address,
      phone: user.phone,
      cin: user.cin,
      country: user.country,
      currency: user.currency,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return sendError('Failed to get user', 500)
  }
}
