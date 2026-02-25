import { NextRequest, NextResponse } from 'next/server'
import { sendJSON, sendError, parseJSON } from '@/lib/middleware'
import { generateTokens } from '@/lib/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  // Role is always BUYER for self-registration; only ADMIN can promote users
})

export async function POST(request: NextRequest) {
  try {
    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { email, password, firstName, lastName, phone } = result.data
    const role = 'BUYER' // Self-registration is always BUYER; only ADMIN can promote

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return sendError('Email already exists', 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        verified: false, // New users are not verified by default
      },
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email)

    return sendJSON(
      {
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
          phone: user.phone,
          country: user.country,
          currency: user.currency,
        },
        accessToken,
        refreshToken,
      },
      201
    )
  } catch (error) {
    console.error('Register error:', error)
    return sendError('Registration failed', 500)
  }
}
