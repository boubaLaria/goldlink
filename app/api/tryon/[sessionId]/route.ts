import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError } from '@/lib/middleware'
import prisma from '@/lib/db'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  getJobStatus,
  downloadOutputImage,
} from '@/lib/services/comfyui.service'

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

    // Session déjà terminée — retourner directement
    if (session.status === 'DONE' || session.status === 'FAILED') {
      return sendJSON({
        sessionId: session.id,
        status: session.status,
        outputImageUrl: session.outputImageUrl,
      })
    }

    // Session sans promptId → encore en file d'attente interne
    if (!session.comfyPromptId) {
      return sendJSON({ sessionId: session.id, status: session.status })
    }

    // Interroger ComfyUI pour l'état du job
    const jobResult = await getJobStatus(session.comfyPromptId)

    if (jobResult.status === 'done' && jobResult.outputFilename) {
      // Télécharger et sauvegarder l'image générée
      const outputFilename = `tryon_output_${uuidv4()}.png`
      const outputDir = path.join('./public/uploads/tryon/outputs')
      const outputPath = path.join(outputDir, outputFilename)
      const outputImageUrl = `/uploads/tryon/outputs/${outputFilename}`

      await downloadOutputImage(jobResult.outputFilename, outputPath)

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

    if (jobResult.status === 'failed') {
      await prisma.tryOnSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      })
      return sendJSON({ sessionId: session.id, status: 'FAILED' })
    }

    // Toujours en cours
    return sendJSON({
      sessionId: session.id,
      status: jobResult.status === 'processing' ? 'PROCESSING' : 'PENDING',
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

    // Supprimer les fichiers images du disque
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
