import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import CampaignIntro from './CampaignIntro'

export default async function CampagnePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, client:clients(name), variants:campaign_variants(*), prizes(*)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !campaign) notFound()

  const activeVariant = campaign.variants?.find((v: { is_active: boolean }) => v.is_active) ?? campaign.variants?.[0]
  if (!activeVariant) notFound()

  return <CampaignIntro campaign={campaign} variant={activeVariant} />
}
