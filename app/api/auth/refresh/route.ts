import { NextRequest } from 'next/server'
import { sendJSON, sendError, parseJSON } from '@/lib/middleware'
import { generateTokens, verifyRefreshToken } from '@/lib/auth'
import { z } from 'zod'

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await parseJSON(request)
    if (!body) {
      return sendError('Invalid request body', 400)
    }

    const result = refreshSchema.safeParse(body)
    if (!result.success) {
      return sendError('Invalid refresh token', 400)
    }

    const { refreshToken } = result.data

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return sendError('Invalid or expired refresh token', 401)
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
      generateTokens(payload.userId, payload.email)

    return sendJSON({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return sendError('Token refresh failed', 500)
  }
}
