import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError } from '@/lib/middleware'

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
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return sendError('Failed to get user', 500)
  }
}
