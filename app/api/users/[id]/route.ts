import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'

const updateUserSchema = z.object({
  role: z.enum(['BUYER', 'SELLER', 'JEWELER', 'ADMIN']).optional(),
  verified: z.boolean().optional(),
})

// PATCH /api/users/[id] — update role or verified status (ADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticate(request)
    if (!admin) return sendError('Unauthorized', 401)
    if (admin.role !== 'ADMIN') return sendError('Admin access required', 403)

    const { id } = await params
    const body = await parseJSON(request)
    if (!body) return sendError('Invalid request body', 400)

    const result = updateUserSchema.safeParse(body)
    if (!result.success) return sendError(result.error.errors[0].message, 400)

    // Prevent admin from demoting themselves
    if (id === admin.id && result.data.role && result.data.role !== 'ADMIN') {
      return sendError('You cannot change your own admin role', 403)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: result.data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verified: true,
      },
    })

    return sendJSON({ data: updated })
  } catch (error: any) {
    if (error?.code === 'P2025') return sendError('User not found', 404)
    console.error('Update user error:', error)
    return sendError('Failed to update user', 500)
  }
}

// DELETE /api/users/[id] — delete a user (ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticate(request)
    if (!admin) return sendError('Unauthorized', 401)
    if (admin.role !== 'ADMIN') return sendError('Admin access required', 403)

    const { id } = await params

    if (id === admin.id) {
      return sendError('You cannot delete your own account', 403)
    }

    await prisma.user.delete({ where: { id } })

    return sendJSON({ message: 'User deleted successfully' })
  } catch (error: any) {
    if (error?.code === 'P2025') return sendError('User not found', 404)
    console.error('Delete user error:', error)
    return sendError('Failed to delete user', 500)
  }
}
