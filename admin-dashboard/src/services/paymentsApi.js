const API_BASE_URL = import.meta.env.VITE_PAYMENT_API_BASE_URL || '/api/payments'

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

function normalizePayment(payment) {
  const rawStatus = payment.payment_status || payment.status || 'Payment Pending'
  const normalizedStatus = String(rawStatus).toLowerCase().replace('payment ', '').replace(/\s+/g, '_')

  return {
    id: Number(payment.id),
    booking_id: Number(payment.booking_id || 0),
    booking_no: payment.booking_no || `BK-${String(payment.booking_id || 0).padStart(5, '0')}`,
    guest_name: payment.guest_name || 'Guest',
    guest_email: payment.guest_email || '',
    room_name: payment.room_name || '',
    order_id: payment.order_id || '',
    payment_id: payment.payment_id || '',
    amount: Number(payment.amount || 0),
    currency: payment.currency || 'LKR',
    payment_status: normalizedStatus,
    payment_method: payment.payment_method || payment.method || 'PayHere',
    payment_gateway: payment.payment_gateway || 'PayHere',
    transaction_id: payment.transaction_id || payment.payment_id || payment.order_id || '-',
    invoice_id: payment.invoice_id || null,
    invoice_number: payment.invoice_number || '',
    invoice_file_path: payment.invoice_file_path || '',
    email_status: payment.email_status || 'Not Sent',
    paid_at: payment.paid_at || null,
    created_at: payment.created_at || null,
    updated_at: payment.updated_at || null,
  }
}

export async function fetchPayments() {
  const response = await fetch(`${API_BASE_URL}/list.php`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const payload = await readJsonResponse(response)
  return (payload.data || []).map(normalizePayment)
}
u