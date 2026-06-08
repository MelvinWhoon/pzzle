import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const userId = await requireAdmin(req)
  if (!userId) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user: { id: userId } })
}
