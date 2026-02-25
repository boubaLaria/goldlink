import { NextRequest, NextResponse } from 'next/server'
import { authenticate, sendError } from '@/lib/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = './public/uploads'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return sendError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return sendError('File too large. Maximum 5MB', 400)
    }

    // Generate unique filename
    const ext = extname(file.name)
    const filename = `${uuidv4()}${ext}`
    const categoryDir = category || 'general'
    const filepath = `${UPLOAD_DIR}/${categoryDir}`

    // Create directory if it doesn't exist
    try {
      await mkdir(filepath, { recursive: true })
    } catch {}

    // Write file
    const buffer = await file.arrayBuffer()
    const fullPath = `${filepath}/${filename}`
    await writeFile(fullPath, Buffer.from(buffer))

    // Return URL path
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
