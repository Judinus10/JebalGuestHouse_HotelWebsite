import { API_BASE_URL } from '@/services/config'

const fallbackContactSettings = {
  business_name: 'Jebal Guest House',
  address: 'Old Church Road (near the RC School)\nUyarappulam\nAnnaicoddai\nJaffna\nSri Lanka',
  phone: '+31 6 28324956',
  reception_contact_number: '+94 77 951 8657',
  whatsapp_reservation_number: '+94 77 951 8657',
  email: 'info@jebalguesthouse.com',
  business_hours: 'Daily · 7:00 AM – 10:00 PM',
  facebook_link: '',
  instagram_link: '',
  map_embed_url: '',
  google_maps_url: '',
}

export async function fetchContactSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/get-contact.php`)
    const payload = await response.json()

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Could not load contact settings')
    }

    return {
      ...fallbackContactSettings,
      ...(payload.data || {}),
    }
  } catch (error) {
    console.warn('Using fallback contact settings:', error)
    return fallbackContactSettings
  }
}

export { fallbackContactSettings }
