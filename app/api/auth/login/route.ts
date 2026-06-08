import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { makeSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email en wachtwoord vereist' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Onjuiste inloggegevens' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.headers.set(
    'Set-Cookie',
    makeSessionCookie(data.session.access_token, data.user.id)
  )
  return res
}
