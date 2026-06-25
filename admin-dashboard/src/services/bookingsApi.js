import { bookingRooms } from '@/data/bookingData'
import { apiFetch, buildApiUrl, readJsonResponse } from '@/services/apiClient'

const BOOKINGS_API_BASE_URL = buildApiUrl('/bookings')
const PUBLIC_BOOKING_URL = buildApiUrl('/submit-booking.php')

export const paymentStatusOptions = ['pending', 'paid', 'failed', 'cancelled', 'refunded']
export const paymentMethodOptions = ['PayHere', 'Cash', 'Bank Transfer']

function normalizeBookingStatus(status) {
  const value = String(status || 'pending')
    .trim()
    .toLowerCase()
    .replace(/^booking\s+/, '')
    .replace(/^payment\s+/, '')
    .replace(/\s+/g, '_')

  if (value === 'confirmed') return 'confirmed'
  if (value === 'cancelled' || value === 'canceled') return 'cancelled'

  // Some API rows may expose the payment status in a generic `status` field.
  // Do not show that as the booking status. Treat it as a pending booking instead.
  if (['paid', 'failed', 'refunded', 'unpaid', 'pending'].includes(value)) return 'pending'

  return 'pending'
}

export function toApiPaymentStatus(status) {
  const value = String(status || 'pending').trim().toLowerCase().replace(/^payment\s+/, '').replace(/\s+/g, '_')

  if (value === 'paid') return 'Paid'
  if (value === 'failed') return 'Failed'
  if (value === 'cancelled' || value === 'canceled') return 'Cancelled'
  if (value === 'refunded') return 'Refunded'
  return 'Payment Pending'
}

export function normalizePaymentStatus(status) {
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
    id: Number(booking.id || booking.booking_id || 0),
    booking_no: booking.booking_no || booking.bookingNo || `BK-${String(booking.id || booking.booking_id || 0).padStart(5, '0')}`,
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
    payment_method: booking.payment_method || booking.method || '',
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
  const response = await apiFetch(`${BOOKINGS_API_BASE_URL}/list.php`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  const payload = await readJsonResponse(response)
  return (payload.data || []).map(normalizeBooking)
}

export async function createManualBooking(formData) {
  const payload = {
    full_name: formData.full_name,
    email: formData.email,
    phone: formData.phone,
    room_name: formData.room_name,
    check_in_date: formData.check_in_date,
    check_out_date: formData.check_out_date,
    guests: Number(formData.guests || 1),
    message: formData.message || '',
    payment_status: toApiPaymentStatus(formData.payment_status || 'pending'),
    payment_method: formData.payment_method || 'Cash',
  }

  const response = await apiFetch(`${BOOKINGS_API_BASE_URL}/create-manual.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await readJsonResponse(response)
  return normalizeBooking(result.data || result)
}

export async function createPublicBooking(formData) {
  const response = await apiFetch(PUBLIC_BOOKING_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  return readJsonResponse(response)
}

export async function updateBookingStatus(bookingId, status) {
  const response = await apiFetch(`${BOOKINGS_API_BASE_URL}/update-status.php`, {
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

export async function updatePaymentStatus(bookingId, paymentStatus, paymentMethod = '') {
  const response = await apiFetch(`${BOOKINGS_API_BASE_URL}/update-payment-status.php`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: bookingId,
      payment_status: toApiPaymentStatus(paymentStatus),
      payment_method: paymentMethod,
    }),
  })

  const payload = await readJsonResponse(response)
  const data = payload.data || {}

  return {
    id: Number(data.id || bookingId),
    payment_status: normalizePaymentStatus(data.payment_status || paymentStatus),
    payment_method: data.payment_method || paymentMethod,
  }
}

export async function deleteBooking(bookingId) {
  const response = await apiFetch(`${BOOKINGS_API_BASE_URL}/delete.php`, {
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
