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
