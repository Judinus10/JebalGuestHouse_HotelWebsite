import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Clock, Share2 } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import Button from '../components/ui/Button'
import logo from '../assets/logo.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const PAYMENT_STATUS_API_URL = `${API_BASE_URL}/payments/status.php`
const HOTEL_NAME = 'Jebal Guest House'
const HOTEL_PHONE = '0707894862'
const HOTEL_EMAIL = 'jebalguesthouse@gmail.com'

function formatMoney(amount, currency = 'LKR') {
  const value = Number(amount || 0)
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status) {
  if (status === 'Paid') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'Failed' || status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-yellow-200 bg-yellow-50 text-yellow-700'
}

function statusLabel(status) {
  if (status === 'Paid') return 'PAID'
  if (status === 'Failed') return 'FAILED'
  if (status === 'Cancelled') return 'CANCELLED'
  return 'DUE'
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : 1
}

export default function BookingBill() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id') || ''
  const orderId = searchParams.get('order_id') || ''
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bill, setBill] = useState(null)

  const statusUrl = useMemo(() => {
    const params = new URLSearchParams({ booking_id: bookingId, order_id: orderId, token })
    return `${PAYMENT_STATUS_API_URL}?${params.toString()}`
  }, [bookingId, orderId, token])

  const loadBill = useCallback(async () => {
    if (!bookingId || !orderId || !token) return

    try {
      const response = await fetch(statusUrl, { headers: { Accept: 'application/json' } })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load booking bill.')
      }

      setBill(result.booking)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load booking bill.')
    } finally {
      setLoading(false)
    }
  }, [bookingId, orderId, statusUrl, token])

  useEffect(() => {
    loadBill()
  }, [loadBill])

  useEffect(() => {
    if (!bill || bill.payment_status !== 'Payment Pending') return
    const timer = window.setInterval(loadBill, 5000)
    return () => window.clearInterval(timer)
  }, [bill, loadBill])

  if (!bookingId || !orderId || !token) {
    return <Navigate to="/rooms" replace />
  }

  const handleShare = async () => {
    const shareText = bill
      ? `${HOTEL_NAME} booking bill - ${bill.room_name} - ${bill.payment_status}`
      : `${HOTEL_NAME} booking bill`

    if (navigator.share) {
      await navigator.share({ title: `${HOTEL_NAME} Booking Bill`, text: shareText, url: window.location.href })
      return
    }

    await navigator.clipboard.writeText(window.location.href)
    alert('Bill link copied to clipboard.')
  }

  const roomTotal = Number(bill?.amount || 0)
  const roomPaid = bill?.payment_status === 'Paid' ? roomTotal : 0
  const roomBalance = Math.max(roomTotal - roomPaid, 0)
  const hotelPhone = bill?.hotel_phone || bill?.contact_phone || HOTEL_PHONE
  const hotelEmail = bill?.hotel_email || bill?.contact_email || HOTEL_EMAIL
  const nights = bill ? nightsBetween(bill.check_in_date, bill.check_out_date) : 1
  const generatedAt = formatDateTime(new Date().toISOString())

  return (
    <PageTransition>
      <section className="min-h-screen bg-[#eef3fb] py-8 print:bg-white print:py-0">
        <div className="mx-auto max-w-5xl px-4 print:max-w-none print:px-0">
          <FadeUp>
            <Link
              to="/rooms"
              className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase hover:text-charcoal print:hidden"
            >
              <ArrowLeft size={14} />
              Back to Rooms
            </Link>

            {loading ? (
              <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
                <Clock className="mx-auto mb-4 text-gold" size={34} />
                <p className="font-serif text-2xl text-charcoal">Loading your booking bill...</p>
                <p className="mt-3 text-sm text-muted">Checking the latest payment status.</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
                <AlertTriangle className="mx-auto mb-4 text-red-600" size={34} />
                <p className="font-serif text-2xl text-charcoal">Bill not available</p>
                <p className="mt-3 text-sm text-muted">{error}</p>
                <Button to="/rooms" className="mt-8">View Rooms</Button>
              </div>
            ) : (
              <>
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none">
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-[0.07] grayscale print:opacity-[0.08]"
                  />

                  <div className="relative z-10 bg-gradient-to-r from-[#1d4ed8] to-[#1e3a8a] px-6 py-5 text-white print:bg-[#1e3a8a]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
                          <img src={logo} alt={HOTEL_NAME} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h1 className="text-xl font-extrabold leading-tight">{HOTEL_NAME}</h1>
                          <p className="text-sm text-white/90">{hotelPhone} • {hotelEmail}</p>
                        </div>
                      </div>

                      <div className="text-left text-sm sm:text-right">
                        <p>Generated: {generatedAt}</p>
                        <p>Booking ID: <span className="font-semibold">BK-{String(bill.id).padStart(6, '0')}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 p-6">
                    {bill.payment_status === 'Payment Pending' && (
                      <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        Payment notification is still being verified. This page will refresh automatically.
                      </div>
                    )}

                    {(bill.payment_status === 'Failed' || bill.payment_status === 'Cancelled') && (
                      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Payment failed. Your booking is still pending. The hotel team will contact you shortly.
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                        <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Guest</p>
                        <p className="mt-5 font-bold text-slate-950">{bill.full_name}</p>
                        <p className="text-sm text-slate-800">Phone: {bill.phone || '-'}</p>
                        <p className="text-sm text-slate-800">Email: {bill.email || '-'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                        <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Stay</p>
                        <p className="mt-5 text-sm font-semibold text-slate-900">{bill.check_in_date} → {bill.check_out_date}</p>
                        <p className="mt-1 text-sm text-slate-800">{nights} night{nights === 1 ? '' : 's'} • Guests: {bill.guests || 1}</p>
                        <p className="mt-1 text-sm text-slate-800">Room: <span className="font-semibold">{bill.room_name}</span></p>
                        <p className="mt-1 text-sm text-slate-800">Method: {bill.payment_method || 'PayHere'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Payment</p>
                          <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusBadgeClass(bill.payment_status)}`}>
                            {statusLabel(bill.payment_status)}
                          </span>
                        </div>
                        <p className="mt-8 text-sm text-slate-800">
                          {bill.payment_status === 'Paid'
                            ? 'Thank you for your payment.'
                            : bill.payment_status === 'Payment Pending'
                              ? 'Payment verification is pending.'
                              : 'Payment was not successful.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-bold text-slate-950">Total Charges</p>
                        <p className="font-extrabold text-blue-700">{formatMoney(roomTotal, bill.currency)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="font-bold text-slate-950">Paid</p>
                        <p className="font-extrabold text-green-700">{formatMoney(roomPaid, bill.currency)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="font-bold text-slate-950">Balance</p>
                        <p className="font-extrabold text-red-600">{formatMoney(roomBalance, bill.currency)}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-white/70 p-5">
                      <p className="font-bold text-slate-950">Notes:</p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
                        <li>Please keep this bill for your records.</li>
                        <li>The room is booked from check-in day morning 11:30 AM to check-out day morning 11:00 AM.</li>
                        <li>For billing queries, contact the front desk at {hotelPhone}.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 rounded-b-2xl bg-slate-100 p-4 shadow-xl print:hidden">
                  <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50">
                    <Share2 size={16} />
                    Share
                  </button>
                  {bill.invoice_download_url && bill.payment_status === 'Paid' && (
                    <a href={bill.invoice_download_url} className="rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50">
                      Download Bill
                    </a>
                  )}
                </div>
              </>
            )}
          </FadeUp>
        </div>
      </section>
    </PageTransition>
  )
}
