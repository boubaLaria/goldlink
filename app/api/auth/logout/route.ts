import { sendJSON } from '@/lib/middleware'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  return sendJSON({ success: true })
}
