import { API_BASE_URL } from './config'

function normalizeResponse(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rooms)) return payload.rooms
  return []
}

export async function fetchRooms() {
  const response = await fetch(`${API_BASE_URL}/rooms/public-list.php`, {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to load rooms.')
  }
  return normalizeResponse(payload)
}

export async function fetchRoom(idOrSlug) {
  const response = await fetch(`${API_BASE_URL}/rooms/detail.php?id=${encodeURIComponent(idOrSlug)}`, {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to load room.')
  }
  return payload.data || payload.room
}
