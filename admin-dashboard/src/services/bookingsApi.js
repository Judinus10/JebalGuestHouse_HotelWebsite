const API_BASE_URL = import.meta.env.VITE_BOOKING_API_BASE_URL || '/api/bookings'

async function readJsonResponse(response) {
  let payload = null

  try {
    payload = await response.json()
  } catch (error) {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed. Please try again.')
  }

  return payload
}

export async function fetchBookings() {
  const response = await fetch(`${API_BASE_URL}/list.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return payload.data || []
}

export async function updateBookingStatus(bookingId, status) {
  const response = await fetch(`${API_BASE_URL}/update-status.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: bookingId, status }),
  })

  const payload = await readJsonResponse(response)
  return payload.data
}

export async function deleteBooking(bookingId) {
  const response = await fetch(`${API_BASE_URL}/delete.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: bookingId }),
  })

  const payload = await readJsonResponse(response)
  return payload.data
}
