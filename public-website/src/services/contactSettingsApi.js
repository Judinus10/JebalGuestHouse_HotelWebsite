import { API_BASE_URL } from '@/services/config'

const fallbackContactSettings = {
  business_name: 'Jebal Guest House',
  address: 'Jebal Guest House, Sri Lanka',
  phone: '+94 77 123 4567',
  reception_contact_number: '+94 21 222 4567',
  whatsapp_reservation_number: '+94 77 123 4567',
  email: 'reservations@jebalguesthouse.com',
  business_hours: 'Daily · 7:00 AM – 10:00 PM',
  facebook_link: '',
  instagram_link: '',
  map_embed_url: '',
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