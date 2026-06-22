const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/HotelWebsite/api'

export async function fetchExperiences() {
  const response = await fetch(
    `${API_BASE_URL}/experience/public-list.php`
  )

  const payload = await response.json()

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Failed to load experiences.')
  }

  return payload.data || []
}