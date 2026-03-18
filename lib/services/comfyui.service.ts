import { TryOnType } from '@/lib/types'
import fs from 'fs/promises'
import path from 'path'

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://comfyui:8188'

// Zone de masque selon le type de bijou (région inpaint)
const TRYON_PROMPTS: Record<TryOnType, string> = {
  FACE: 'photorealistic earrings on ears, gold jewelry, natural skin, studio lighting, high detail',
  NECK: 'photorealistic necklace on neck, gold jewelry, natural skin, studio lighting, high detail',
  WRIST: 'photorealistic bracelet on wrist, gold jewelry, natural skin, studio lighting, high detail',
  FINGER: 'photorealistic ring on finger, gold jewelry, natural skin, studio lighting, high detail',
  MULTI: 'photorealistic jewelry set on body, gold jewelry, natural skin, studio lighting, high detail',
}

/**
 * Construit le workflow ComfyUI dynamiquement en injectant les images et le prompt
 */
export function buildTryOnWorkflow(
  userImageFilename: string,
  jewelryPngFilename: string,
  tryOnType: TryOnType
): Record<string, unknown> {
  const positivePrompt = TRYON_PROMPTS[tryOnType]

  return {
    '4': {
      inputs: { ckpt_name: 'juggernautXL_version9Rundiffusion.safetensors' },
      class_type: 'CheckpointLoaderSimple',
    },
    '6': {
      inputs: {
        text: positivePrompt,
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '7': {
      inputs: {
        text: 'blurry, low quality, cartoon, illustration, deformed, ugly, artifacts, watermark, text',
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '10': {
      inputs: { image: userImageFilename, upload: 'image' },
      class_type: 'LoadImage',
    },
    '11': {
      inputs: { image: jewelryPngFilename, upload: 'image' },
      class_type: 'LoadImage',
    },
    '20': {
      inputs: { ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors' },
      class_type: 'IPAdapterModelLoader',
    },
    '21': {
      inputs: {
        model: ['4', 0],
        ipadapter: ['20', 0],
        image: ['11', 0],
        weight: 0.85,
        start_at: 0.0,
        end_at: 1.0,
      },
      class_type: 'IPAdapterApply',
    },
    '25': {
      inputs: {
        seed: Math.floor(Math.random() * 1_000_000),
        steps: 30,
        cfg: 7.0,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 0.75,
        model: ['21', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['26', 0],
      },
      class_type: 'KSampler',
    },
    '26': {
      inputs: {
        pixels: ['10', 0],
        vae: ['4', 2],
      },
      class_type: 'VAEEncode',
    },
    '30': {
      inputs: {
        samples: ['25', 0],
        vae: ['4', 2],
      },
      class_type: 'VAEDecode',
    },
    '40': {
      inputs: {
        images: ['30', 0],
        filename_prefix: 'goldlink_tryon',
      },
      class_type: 'SaveImage',
    },
  }
}

/**
 * Upload une image vers ComfyUI (input folder)
 */
export async function uploadImageToComfyUI(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/png' })
  formData.append('image', blob, filename)
  formData.append('type', 'input')
  formData.append('overwrite', 'true')

  const response = await fetch(`${COMFYUI_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`ComfyUI upload failed: ${response.statusText}`)
  }

  const result = await response.json()
  return result.name as string
}

/**
 * Soumet un workflow à ComfyUI et retourne le prompt_id
 */
export async function submitWorkflow(
  workflow: Record<string, unknown>
): Promise<string> {
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  })

  if (!response.ok) {
    throw new Error(`ComfyUI submit failed: ${response.statusText}`)
  }

  const result = await response.json()
  return result.prompt_id as string
}

export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

/**
 * Vérifie le statut d'un job ComfyUI et retourne l'URL de l'image si terminé
 */
export async function getJobStatus(
  promptId: string
): Promise<{ status: JobStatus; outputFilename?: string }> {
  // Vérifier si le job est dans la queue
  const queueRes = await fetch(`${COMFYUI_URL}/queue`)
  if (queueRes.ok) {
    const queue = await queueRes.json()
    const running = (queue.queue_running || []) as Array<[number, string]>
    const pending = (queue.queue_pending || []) as Array<[number, string]>

    const isRunning = running.some((item) => item[1] === promptId)
    const isPending = pending.some((item) => item[1] === promptId)

    if (isRunning) return { status: 'processing' }
    if (isPending) return { status: 'pending' }
  }

  // Vérifier dans l'historique
  const histRes = await fetch(`${COMFYUI_URL}/history/${promptId}`)
  if (!histRes.ok) return { status: 'pending' }

  const history = await histRes.json()
  const entry = history[promptId]

  if (!entry) return { status: 'pending' }

  const outputs = entry.outputs || {}
  for (const nodeId of Object.keys(outputs)) {
    const images = outputs[nodeId]?.images || []
    if (images.length > 0) {
      return { status: 'done', outputFilename: images[0].filename }
    }
  }

  return { status: 'failed' }
}

/**
 * Télécharge l'image générée depuis ComfyUI et la sauvegarde localement
 */
export async function downloadOutputImage(
  filename: string,
  destinationPath: string
): Promise<void> {
  const response = await fetch(
    `${COMFYUI_URL}/view?filename=${filename}&type=output`
  )

  if (!response.ok) {
    throw new Error(`Failed to download output image: ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.mkdir(path.dirname(destinationPath), { recursive: true })
  await fs.writeFile(destinationPath, buffer)
}

/**
 * Vérifie si ComfyUI est disponible
 */
export async function isComfyUIHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}
