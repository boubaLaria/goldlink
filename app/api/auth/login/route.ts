import { NextRequest, NextResponse } from 'next/server'
import { sendJSON, sendError, parseJSON } from '@/lib/middleware'
import { generateTokens } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { email, password } = result.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return sendError('Invalid email or password', 401)
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
    if (!passwordMatch) {
      return sendError('Invalid email or password', 401)
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    return sendJSON({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified,
        rating: user.rating,
        address: user.address,
        country: user.country,
        currency: user.currency,
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return sendError('Login failed', 500)
  }
}
