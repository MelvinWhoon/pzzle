import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import CampaignIntro from './CampaignIntro'

export default async function CampagnePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [campaignRes, countRes] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*, client:clients(name, logo_url), variants:campaign_variants(*), prizes(*)')
      .eq('id', id)
      .eq('status', 'active')
      .single(),
    supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .not('player_id', 'is', null),
  ])

  if (campaignRes.error || !campaignRes.data) notFound()

  const campaign = campaignRes.data
  const playerCount = countRes.count ?? 0

  const activeVariant = campaign.variants?.find((v: { is_active: boolean }) => v.is_active) ?? campaign.variants?.[0]
  if (!activeVariant) notFound()

  return <CampaignIntro campaign={campaign} variant={activeVariant} playerCount={playerCount} />
}
