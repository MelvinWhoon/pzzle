import { Campaign, LocationInput } from '@/lib/types'

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function matchCampaigns(
  campaigns: Campaign[],
  location: LocationInput
): Campaign[] {
  return campaigns.filter((c) => {
    // GPS radius match
    if (location.lat && location.lng && c.lat && c.lng && c.radius_km) {
      const dist = haversineKm(location.lat, location.lng, c.lat, c.lng)
      if (dist <= c.radius_km) return true
    }

    // Postcode match (prefix vergelijking, eerste 4 cijfers)
    if (location.postcode && c.postal_codes?.length) {
      const inputCode = location.postcode.replace(/\s/g, '').slice(0, 4)
      if (c.postal_codes.some((pc) => pc.replace(/\s/g, '').startsWith(inputCode))) {
        return true
      }
    }

    // Stad match
    if (location.city && c.city) {
      if (c.city.toLowerCase() === location.city.toLowerCase()) return true
    }

    return false
  })
}

export function normalizePostcode(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase().slice(0, 6)
}
