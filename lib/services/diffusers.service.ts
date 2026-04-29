import { TryOnType } from '@/lib/types'
import fs from 'fs/promises'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const DIFFUSERS_URL = process.env.DIFFUSERS_URL || 'http://host.docker.internal:8189'

/**
 * Soumet un job de génération au microservice Diffusers
 * Retourne le job_id pour polling
 */
export async function submitDiffusersJob(
  userImageBuffer: Buffer,
  tryOnType: TryOnType
): Promise<string> {
  const userImageB64 = userImageBuffer.toString('base64')

  const res = await fetch(`${DIFFUSERS_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_image: userImageB64,
      try_on_type: tryOnType,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Diffusers generate failed: ${err}`)
  }

  const data = await res.json()
  return data.job_id as string
}

export type DiffusersJobStatus = 'pending' | 'processing' | 'done' | 'failed'

/**
 * Vérifie le statut d'un job Diffusers
 */
export async function getDiffusersJobStatus(jobId: string): Promise<{
  status: DiffusersJobStatus
  outputImageB64?: string
}> {
  const res = await fetch(`${DIFFUSERS_URL}/status/${jobId}`, {
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) return { status: 'failed' }

  const data = await res.json()
  return {
    status: data.status as DiffusersJobStatus,
    outputImageB64: data.output_image ?? undefined,
  }
}

/**
 * Sauvegarde le résultat base64 sur le disque et retourne l'URL publique
 */
export async function saveDiffusersOutput(base64Image: string): Promise<string> {
  const buffer = Buffer.from(base64Image, 'base64')
  const filename = `tryon_output_${uuidv4()}.png`
  const outputDir = path.join('./public/uploads/tryon/outputs')
  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, filename), buffer)
  return `/uploads/tryon/outputs/${filename}`
}

/**
 * Vérifie si le service Diffusers est disponible
 */
export async function isDiffusersHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${DIFFUSERS_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}
