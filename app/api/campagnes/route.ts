import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { matchCampaigns } from '@/lib/location'
import { LocationInput } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body: LocationInput = await req.json()
  const supabase = createServiceClient()

  const now = new Date().toISOString()
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*, client:clients(name), variants:campaign_variants(*)')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let matched = matchCampaigns(campaigns ?? [], body)

  // Fallback: als geen lokale campagne, gebruik meest recente
  if (matched.length === 0 && campaigns && campaigns.length > 0) {
    matched = [campaigns[0]]
  }

  return NextResponse.json({ campaigns: matched })
}
