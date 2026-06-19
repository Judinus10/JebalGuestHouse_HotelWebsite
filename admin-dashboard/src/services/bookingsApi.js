import { bookingRooms } from '@/data/bookingData'
import { apiFetch, buildApiUrl, readJsonResponse } from '@/services/apiClient'

const API_BASE_URL = buildApiUrl('/bookings')

function normalizeBookingStatus(status) {
  const value = String(status || 'pending').trim().toLowerCase().replace(/\s+/g, '_')

  if (value === 'confirmed') return 'confirmed'
  if (value === 'cancelled' || value === 'canceled') return 'cancelled'
  return 'pending'
}

function normalizePaymentStatus(status) {
  const value = String(status || 'Payment Pending')
    .trim()
    .toLowerCase()
    .replace(/^payment\s+/, '')
    .replace(/\s+/g, '_')

  if (value === 'paid') return 'paid'
  if (value === 'failed') return 'failed'
  if (value === 'cancelled' || value === 'canceled') return 'cancelled'
  if (value === 'refunded') return 'refunded'
  if (value === 'unpaid') return 'pending'
  return 'pending'
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1

  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1

  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
}

function getRoomByName(roomName) {
  return bookingRooms.find((room) => room.room_name.toLowerCase() === String(roomName || '').toLowerCase())
}

export function normalizeBooking(booking) {
  const roomName = booking.room_name || booking.roomName || ''
  const room = getRoomByName(roomName)
  const checkIn = booking.check_in || booking.check_in_date || booking.checkIn || ''
  const checkOut = booking.check_out || booking.check_out_date || booking.checkOut || ''
  const guests = Number(booking.guests || booking.guest_count || booking.adults || 1)
  const totalNights = Number(booking.total_nights || booking.nights || calculateNights(checkIn, checkOut))

  return {
    id: Number(booking.id || 0),
    booking_no: booking.booking_no || booking.bookingNo || `BK-${String(booking.id || 0).padStart(5, '0')}`,
    guest_name: booking.guest_name || booking.full_name || booking.name || 'Guest',
    guest_email: booking.guest_email || booking.email || '',
    guest_phone: booking.guest_phone || booking.phone || '',
    room_id: Number(booking.room_id || room?.id || 0),
    room_name: roomName || room?.room_name || 'Unknown room',
    room_type: booking.room_type || room?.room_type || '-',
    room_code: booking.room_code || `R${String(room?.id || booking.room_id || 0).padStart(2, '0')}`,
    property_type: booking.property_type || room?.room_type || 'Guest House',
    check_in: checkIn,
    check_out: checkOut,
    check_in_date: checkIn,
    check_out_date: checkOut,
    guests,
    adults: Number(booking.adults || guests || 1),
    children: Number(booking.children || 0),
    total_nights: totalNights,
    booking_status: normalizeBookingStatus(booking.booking_status || booking.status),
    payment_status: normalizePaymentStatus(booking.payment_status),
    total_amount: Number(booking.total_amount || booking.amount || 0),
    payment_currency: booking.payment_currency || booking.currency || 'LKR',
    special_requests: booking.special_requests || booking.special_request || booking.message || '',
    special_request: booking.special_request || booking.special_requests || booking.message || '',
    invoice_number: booking.invoice_number || '',
    invoice_file_path: booking.invoice_file_path || '',
    email_status: booking.email_status || 'Pending',
    created_at: booking.created_at || '',
    updated_at: booking.updated_at || '',
  }
}

export async function fetchBookings() {
  const response = await apiFetch(`${API_BASE_URL}/list.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return (payload.data || []).map(normalizeBooking)
}

export async function updateBookingStatus(bookingId, status) {
  const response = await apiFetch(`${API_BASE_URL}/update-status.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: bookingId, status }),
  })

  const payload = await readJsonResponse(response)
  const data = payload.data || {}

  return {
    id: Number(data.id || bookingId),
    booking_status: normalizeBookingStatus(data.booking_status || data.status || status),
  }
}

export async function deleteBooking(bookingId) {
  const response = await apiFetch(`${API_BASE_URL}/delete.php`, {
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
