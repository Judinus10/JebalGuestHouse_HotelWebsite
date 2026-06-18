import { initialBookings } from './bookingData'

export const paymentStatuses = ['pending', 'paid', 'failed', 'refunded']

export const paymentMethods = ['Card', 'Bank Transfer', 'Cash', 'Online Wallet']

export const paymentGateways = ['Stripe', 'PayHere', 'Manual', 'Bank']

const explicitPayments = {
  1: {
    id: 1,
    booking_id: 1,
    amount: 555,
    payment_method: 'Card',
    payment_gateway: 'Stripe',
    transaction_id: 'TXN-GH-9001',
    payment_status: 'paid',
    paid_at: '2026-06-11T14:20:00Z',
    created_at: '2026-06-01T09:40:00Z',
  },
  2: {
    id: 2,
    booking_id: 2,
    amount: 1700,
    payment_method: 'Online Wallet',
    payment_gateway: 'PayHere',
    transaction_id: 'TXN-GH-9002',
    payment_status: 'pending',
    paid_at: null,
    created_at: '2026-06-03T12:50:00Z',
  },
  3: {
    id: 3,
    booking_id: 3,
    amount: 735,
    payment_method: 'Bank Transfer',
    payment_gateway: 'Bank',
    transaction_id: 'TXN-GH-9003',
    payment_status: 'paid',
    paid_at: '2026-06-10T07:25:00Z',
    created_at: '2026-05-25T08:15:00Z',
  },
  4: {
    id: 4,
    booking_id: 4,
    amount: 120,
    payment_method: 'Card',
    payment_gateway: 'Stripe',
    transaction_id: 'TXN-GH-9004',
    payment_status: 'refunded',
    paid_at: '2026-06-05T16:25:00Z',
    created_at: '2026-06-05T16:20:00Z',
  },
  5: {
    id: 5,
    booking_id: 5,
    amount: 3100,
    payment_method: 'Bank Transfer',
    payment_gateway: 'Bank',
    transaction_id: 'TXN-GH-9005',
    payment_status: 'paid',
    paid_at: '2026-06-10T13:05:00Z',
    created_at: '2026-06-06T18:30:00Z',
  },
  6: {
    id: 6,
    booking_id: 6,
    amount: 555,
    payment_method: 'Cash',
    payment_gateway: 'Manual',
    transaction_id: 'TXN-GH-9006',
    payment_status: 'pending',
    paid_at: null,
    created_at: '2026-06-12T07:45:00Z',
  },
}

function normalisePaymentStatus(status) {
  if (status === 'unpaid') return 'pending'
  if (paymentStatuses.includes(status)) return status
  return 'pending'
}

export const initialPayments = initialBookings.map((booking, index) => {
  const explicitPayment = explicitPayments[booking.id]
  const status = normalisePaymentStatus(explicitPayment?.payment_status || booking.payment_status)
  const amount = Number(explicitPayment?.amount ?? booking.total_amount ?? 0)

  return {
    id: explicitPayment?.id ?? index + 1,
    booking_id: booking.id,
    amount,
    payment_method: explicitPayment?.payment_method ?? (status === 'pending' ? 'Cash' : 'Bank Transfer'),
    payment_gateway: explicitPayment?.payment_gateway ?? (status === 'pending' ? 'Manual' : 'Bank'),
    transaction_id: explicitPayment?.transaction_id ?? `TXN-GH-${String(9001 + index)}`,
    payment_status: status,
    paid_at: explicitPayment?.paid_at ?? (status === 'paid' || status === 'refunded' ? booking.updated_at || booking.created_at : null),
    created_at: explicitPayment?.created_at ?? booking.created_at,
    booking_no: booking.booking_no,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    room_id: booking.room_id,
    check_in: booking.check_in,
    check_out: booking.check_out,
  }
})
