import { NextRequest, NextResponse } from 'next/server'
import { authenticate, sendError } from '@/lib/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = './public/uploads'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (GLB files can be large)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_MODEL_TYPES = ['model/gltf-binary', 'application/octet-stream']
const ALLOWED_MODEL_EXTS = ['.glb', '.gltf']

// A real jewelry GLB is never under ~20KB. Reject placeholders below this threshold.
const MIN_GLB_SIZE = 20 * 1024

/**
 * Validates the structural integrity of a .glb binary file.
 * Format spec: 12-byte header (magic 'glTF' + version + length), then chunks.
 * See: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
 */
function validateGlbBinary(buffer: Buffer): { valid: boolean; reason?: string } {
  if (buffer.length < 20) return { valid: false, reason: 'file too small (< 20 bytes)' }

  // Magic: 'glTF' = 0x46546C67 little-endian
  const magic = buffer.readUInt32LE(0)
  if (magic !== 0x46546C67) return { valid: false, reason: 'invalid magic (not a GLB)' }

  const version = buffer.readUInt32LE(4)
  if (version !== 2) return { valid: false, reason: `unsupported GLB version ${version}` }

  const totalLength = buffer.readUInt32LE(8)
  if (totalLength !== buffer.length) {
    return { valid: false, reason: `length mismatch (header=${totalLength}, actual=${buffer.length})` }
  }

  // First chunk must be JSON (type 0x4E4F534A = 'JSON')
  const chunk0Length = buffer.readUInt32LE(12)
  const chunk0Type   = buffer.readUInt32LE(16)
  if (chunk0Type !== 0x4E4F534A) return { valid: false, reason: 'first chunk is not JSON' }
  if (chunk0Length === 0)        return { valid: false, reason: 'empty JSON chunk' }

  // Parse the JSON chunk to check for meshes
  try {
    const jsonBytes = buffer.subarray(20, 20 + chunk0Length)
    const json = JSON.parse(jsonBytes.toString('utf8'))
    if (!Array.isArray(json.meshes) || json.meshes.length === 0) {
      return { valid: false, reason: 'GLB contains no meshes' }
    }
    if (!Array.isArray(json.accessors) || json.accessors.length === 0) {
      return { valid: false, reason: 'GLB contains no geometry accessors' }
    }
  } catch (e) {
    return { valid: false, reason: 'malformed JSON chunk' }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return sendError('Unauthorized', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string | null

    if (!file) {
      return sendError('No file provided', 400)
    }

    const fileExt = extname(file.name).toLowerCase()
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isModel = ALLOWED_MODEL_EXTS.includes(fileExt) &&
      (ALLOWED_MODEL_TYPES.includes(file.type) || file.type === 'application/octet-stream' || file.type === '')

    if (!isImage && !isModel) {
      return sendError('Invalid file type. Allowed: JPEG, PNG, WebP, GLB', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return sendError('File too large. Maximum 50MB', 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate GLB content before writing it to disk
    if (isModel) {
      if (buffer.length < MIN_GLB_SIZE) {
        return sendError(
          `3D model too small (${buffer.length} bytes). A real jewelry GLB is typically 50KB+.`,
          400,
        )
      }
      const glbCheck = validateGlbBinary(buffer)
      if (!glbCheck.valid) {
        return sendError(`Invalid GLB file: ${glbCheck.reason}`, 400)
      }
    }

    const ext = fileExt || (isModel ? '.glb' : '.jpg')
    const filename = `${uuidv4()}${ext}`
    const categoryDir = isModel ? 'models' : (category || 'general')
    const filepath = `${UPLOAD_DIR}/${categoryDir}`

    await mkdir(filepath, { recursive: true })
    await writeFile(`${filepath}/${filename}`, buffer)

    return NextResponse.json({
      url: `/uploads/${categoryDir}/${filename}`,
      filename,
      category: categoryDir,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return sendError('File upload failed', 500)
  }
}
