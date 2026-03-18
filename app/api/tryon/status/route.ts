import { sendJSON } from '@/lib/middleware'
import { isComfyUIHealthy } from '@/lib/services/comfyui.service'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434'

async function isOllamaHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET() {
  const [ollama, comfyui] = await Promise.all([
    isOllamaHealthy(),
    isComfyUIHealthy(),
  ])

  return sendJSON({
    ollama,
    comfyui,
    // fullFeatures = rendu IA disponible (les deux services nécessaires)
    fullFeatures: ollama && comfyui,
    // previewOnly = overlay 2D uniquement (toujours disponible côté client)
    previewOnly: !ollama || !comfyui,
  })
}
