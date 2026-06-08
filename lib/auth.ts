import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

interface AdminSession {
  access_token: string
  user_id: string
}

export async function requireAdmin(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get('admin_session')
  if (!cookie) return null

  let session: AdminSession
  try {
    session = JSON.parse(cookie.value) as AdminSession
  } catch {
    return null
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.getUser(session.access_token)
  if (error || !data.user) return null

  return data.user.id
}

export function makeSessionCookie(access_token: string, user_id: string): string {
  const value = JSON.stringify({ access_token, user_id })
  const maxAge = 60 * 60 * 24 * 7 // 7 dagen
  return `admin_session=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export function clearSessionCookie(): string {
  return 'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
}
