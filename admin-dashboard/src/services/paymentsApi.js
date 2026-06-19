import { apiFetch, buildApiUrl, readJsonResponse } from '@/services/apiClient'

const API_BASE_URL = buildApiUrl('/payments')

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
  return 'pending'
}

function normalizePayment(payment) {
  const paymentStatus = normalizePaymentStatus(payment.payment_status || payment.status)
  const bookingId = Number(payment.booking_id || 0)

  return {
    id: Number(payment.id || 0),
    booking_id: bookingId,
    booking_no: payment.booking_no || `BK-${String(bookingId).padStart(5, '0')}`,
    guest_name: payment.guest_name || payment.full_name || 'Guest',
    guest_email: payment.guest_email || payment.email || '',
    room_name: payment.room_name || '-',
    order_id: payment.order_id || '',
    payment_id: payment.payment_id || '',
    amount: Number(payment.amount || 0),
    currency: payment.currency || 'LKR',
    payment_status: paymentStatus,
    payment_method: payment.payment_method || payment.method || 'PayHere',
    payment_gateway: payment.payment_gateway || 'PayHere',
    transaction_id: payment.transaction_id || payment.payment_id || payment.order_id || `PAY-${String(payment.id || 0).padStart(4, '0')}`,
    invoice_id: payment.invoice_id || null,
    invoice_number: payment.invoice_number || '',
    invoice_file_path: payment.invoice_file_path || '',
    email_status: payment.email_status || 'Pending',
    paid_at: payment.paid_at || null,
    created_at: payment.created_at || null,
    updated_at: payment.updated_at || null,
  }
}

export async function fetchPayments() {
  const response = await apiFetch(`${API_BASE_URL}/list.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return (payload.data || []).map(normalizePayment)
}
