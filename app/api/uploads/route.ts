import { NextRequest, NextResponse } from 'next/server'
import { authenticate, sendError } from '@/lib/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = './public/uploads'
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB (élargi pour les images try-on)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_VALIDATOR_URL = process.env.IMAGE_VALIDATOR_URL || 'http://image-validator:8090'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string | null
    const purpose = formData.get('purpose') as string | null       // 'tryon' pour les images bijou
    const declaredType = formData.get('declaredType') as string | null // TryOnType déclaré

    if (!file) {
      return sendError('No file provided', 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return sendError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return sendError('File too large. Maximum 15MB', 400)
    }

    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // ── Validation try-on via microservice Python ─────────────────
    if (purpose === 'tryon') {
      const validationForm = new FormData()
      const blob = new Blob([fileBuffer], { type: file.type })
      validationForm.append('file', blob, file.name)
      if (declaredType) validationForm.append('declared_type', declaredType)

      let validationResult: any = null
      try {
        const validationRes = await fetch(`${IMAGE_VALIDATOR_URL}/validate`, {
          method: 'POST',
          body: validationForm,
          signal: AbortSignal.timeout(60_000), // LLaVA peut prendre du temps
        })
        validationResult = await validationRes.json()
      } catch {
        // Microservice indisponible → on laisse passer avec un warning
        validationResult = { valid: true, warnings: ['Validation indisponible — vérification manuelle requise.'], pngBase64: null }
      }

      if (!validationResult.valid) {
        return NextResponse.json({
          valid: false,
          errors: validationResult.errors || [],
          warnings: validationResult.warnings || [],
        }, { status: 422 })
      }

      // Sauvegarder le PNG transparent retourné par le microservice (ou l'original si pas de base64)
      const categoryDir = 'jewelry/tryon'
      const filename = `${uuidv4()}.png`
      const filepath = `${UPLOAD_DIR}/${categoryDir}`
      await mkdir(filepath, { recursive: true })

      if (validationResult.pngBase64) {
        await writeFile(`${filepath}/${filename}`, Buffer.from(validationResult.pngBase64, 'base64'))
      } else {
        await writeFile(`${filepath}/${filename}`, fileBuffer)
      }

      const urlPath = `/uploads/${categoryDir}/${filename}`

      return NextResponse.json({
        valid: true,
        url: urlPath,
        filename,
        category: categoryDir,
        detectedType: validationResult.detectedType,
        confidence: validationResult.confidence,
        typeMismatch: validationResult.typeMismatch,
        warnings: validationResult.warnings || [],
      }, { status: 201 })
    }

    // ── Upload standard (non try-on) ──────────────────────────────
    const ext = extname(file.name)
    const filename = `${uuidv4()}${ext}`
    const categoryDir = category || 'general'
    const filepath = `${UPLOAD_DIR}/${categoryDir}`

    try {
      await mkdir(filepath, { recursive: true })
    } catch {}

    const fullPath = `${filepath}/${filename}`
    await writeFile(fullPath, fileBuffer)

    const urlPath = `/uploads/${categoryDir}/${filename}`

    return NextResponse.json({
      url: urlPath,
      filename,
      category: categoryDir,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return sendError('File upload failed', 500)
  }
}
