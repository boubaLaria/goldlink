import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError } from '@/lib/middleware'
import prisma from '@/lib/db'
import path from 'path'
import {
  getDiffusersJobStatus,
  saveDiffusersOutput,
} from '@/lib/services/diffusers.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)

    const session = await prisma.tryOnSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) return sendError('Session not found', 404)
    if (session.userId !== user.id) return sendError('Forbidden', 403)

    // Session déjà terminée
    if (session.status === 'DONE' || session.status === 'FAILED') {
      return sendJSON({
        sessionId: session.id,
        status: session.status,
        outputImageUrl: session.outputImageUrl,
      })
    }

    // Pas encore de jobId — toujours en file interne
    if (!session.comfyPromptId) {
      return sendJSON({ sessionId: session.id, status: session.status })
    }

    // Interroger le service Diffusers
    const job = await getDiffusersJobStatus(session.comfyPromptId)

    if (job.status === 'done' && job.outputImageB64) {
      const outputImageUrl = await saveDiffusersOutput(job.outputImageB64)

      const updated = await prisma.tryOnSession.update({
        where: { id: sessionId },
        data: { status: 'DONE', outputImageUrl },
      })

      return sendJSON({
        sessionId: updated.id,
        status: 'DONE',
        outputImageUrl: updated.outputImageUrl,
      })
    }

    if (job.status === 'failed') {
      await prisma.tryOnSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      })
      return sendJSON({ sessionId: session.id, status: 'FAILED' })
    }

    return sendJSON({
      sessionId: session.id,
      status: job.status === 'processing' ? 'PROCESSING' : 'PENDING',
    })
  } catch (error) {
    console.error('TryOn polling error:', error)
    return sendError('Failed to get session status', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)

    const session = await prisma.tryOnSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, inputImageUrl: true, outputImageUrl: true },
    })

    if (!session) return sendError('Session not found', 404)
    if (session.userId !== user.id && user.role !== 'ADMIN') {
      return sendError('Forbidden', 403)
    }

    const { unlink } = await import('fs/promises')
    const filesToDelete = [session.inputImageUrl, session.outputImageUrl].filter(Boolean)
    await Promise.allSettled(
      filesToDelete.map((url) => unlink(path.join('./public', url!)))
    )

    await prisma.tryOnSession.delete({ where: { id: sessionId } })

    return sendJSON({ success: true })
  } catch (error) {
    console.error('TryOn delete error:', error)
    return sendError('Failed to delete session', 500)
  }
}
