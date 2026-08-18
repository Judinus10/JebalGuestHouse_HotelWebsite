import { API_BASE_URL } from '@/services/config'

const fallbackPropertyContent = {
  amenities: [],
  nearby_places: [],
}

export async function fetchPropertyContent() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/get-property-content.php`, {
      headers: { Accept: 'application/json' },
    })
    const payload = await response.json()

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Could not load property information.')
    }

    return {
      amenities: Array.isArray(payload.data?.amenities) ? payload.data.amenities : [],
      nearby_places: Array.isArray(payload.data?.nearby_places) ? payload.data.nearby_places : [],
    }
  } catch (error) {
    console.warn('Property information is unavailable:', error)
    return fallbackPropertyContent
  }
}
