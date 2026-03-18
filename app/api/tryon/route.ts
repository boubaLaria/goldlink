import { NextRequest } from 'next/server'
import { authenticate, sendJSON, sendError, parseJSON } from '@/lib/middleware'
import prisma from '@/lib/db'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { submitDiffusersJob } from '@/lib/services/diffusers.service'
import { TryOnType } from '@/lib/types'

const UPLOAD_DIR = './public/uploads'

const tryOnCreateSchema = z.object({
  jewelryId: z.string().min(1),
  inputImage: z.string().min(1), // base64 de l'image utilisateur
  mode: z.enum(['WEBCAM', 'UPLOAD']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) return sendError('Unauthorized', 401)

    const body = await parseJSON(request)
    if (!body) return sendError('Invalid request body', 400)

    const result = tryOnCreateSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const { jewelryId, inputImage, mode } = result.data

    const jewelry = await prisma.jewelry.findUnique({
      where: { id: jewelryId },
      select: { id: true, tryOnAvailable: true, tryOnType: true, tryOnImageUrl: true },
    })

    if (!jewelry) return sendError('Jewelry not found', 404)
    if (!jewelry.tryOnAvailable) return sendError('Virtual try-on not available for this jewelry', 400)
    if (!jewelry.tryOnImageUrl) return sendError('Jewelry try-on image not configured', 400)

    // Sauvegarder l'image utilisateur
    const base64Data = inputImage.replace(/^data:image\/\w+;base64,/, '')
    const userImageBuffer = Buffer.from(base64Data, 'base64')
    const userImageFilename = `tryon_input_${uuidv4()}.png`
    const userImageDir = path.join(UPLOAD_DIR, 'tryon', 'inputs')
    await mkdir(userImageDir, { recursive: true })
    await writeFile(path.join(userImageDir, userImageFilename), userImageBuffer)
    const inputImageUrl = `/uploads/tryon/inputs/${userImageFilename}`

    // Créer la session PENDING
    const session = await prisma.tryOnSession.create({
      data: {
        userId: user.id,
        jewelryId,
        mode,
        status: 'PENDING',
        inputImageUrl,
      },
    })

    // Lancer la génération en arrière-plan
    submitTryOnJob(session.id, userImageBuffer, jewelry.tryOnType as TryOnType).catch(
      (err) => console.error(`[TryOn] Job failed for session ${session.id}:`, err)
    )

    return sendJSON({ sessionId: session.id, status: 'PENDING' }, 201)
  } catch (error) {
    console.error('TryOn create error:', error)
    return sendError('Failed to start try-on session', 500)
  }
}

async function submitTryOnJob(
  sessionId: string,
  userImageBuffer: Buffer,
  tryOnType: TryOnType
) {
  try {
    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: { status: 'PROCESSING' },
    })

    const jobId = await submitDiffusersJob(userImageBuffer, tryOnType)

    // Stocker le jobId dans comfyPromptId (réutilisation du champ existant)
    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: { comfyPromptId: jobId },
    })
  } catch (error) {
    await prisma.tryOnSession.update({
      where: { id: sessionId },
      data: { status: 'FAILED' },
    })
    throw error
  }
}
