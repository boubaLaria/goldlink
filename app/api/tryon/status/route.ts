import { sendJSON } from '@/lib/middleware'
import { isDiffusersHealthy } from '@/lib/services/diffusers.service'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434'

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
  const [ollama, diffusers] = await Promise.all([
    isOllamaHealthy(),
    isDiffusersHealthy(),
  ])

  return sendJSON({
    ollama,
    diffusers,
    fullFeatures: diffusers,         // rendu IA dispo si Diffusers tourne
    previewOnly: !diffusers,         // overlay 2D uniquement sinon
  })
}
