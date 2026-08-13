import { API_BASE_URL } from './config'

function normalizeResponse(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rooms)) return payload.rooms
  return []
}

function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export async function fetchRooms(filters = {}) {
  const response = await fetch(`${API_BASE_URL}/rooms/public-list.php${buildQuery(filters)}`, {
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

export async function checkRoomAvailability({ roomId, roomName, checkInDate, checkOutDate, guests }) {
  const response = await fetch(`${API_BASE_URL}/check-availability.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      room_id: roomId,
      room_name: roomName,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      guests,
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to check availability.')
  }

  return payload
}
