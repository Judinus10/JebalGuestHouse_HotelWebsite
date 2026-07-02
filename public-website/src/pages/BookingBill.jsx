import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Bookmark, CalendarDays, ChevronDown, Clock, Download, FileText, Globe2, Headphones, Mail, MapPin, Phone, RotateCcw, Share2, UserRound } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import Button from '../components/ui/Button'
import logo from '../assets/logo.png'

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function resolveApiBaseUrl() {
  const baseUrl = String(RAW_API_BASE_URL || '/api').replace(/\/$/, '')

  if (/^https?:\/\//i.test(baseUrl)) {
    return baseUrl
  }

  const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const isVitePort = ['5173', '5174'].includes(window.location.port)

  if (isLocalFrontend && isVitePort && baseUrl.startsWith('/HotelWebsite/api')) {
    return `http://${window.location.hostname}${baseUrl}`
  }

  return baseUrl
}

const API_BASE_URL = resolveApiBaseUrl()
const PAYMENT_STATUS_API_URL = `${API_BASE_URL}/payments/status.php`
const PAYMENT_INIT_API_URL = `${API_BASE_URL}/payments/create-checkout-session.php`
const CONTACT_SETTINGS_API_URL = `${API_BASE_URL}/settings/get-contact.php`

const FALLBACK_HOTEL_NAME = 'Jebal Guest House'
const FALLBACK_HOTEL_PHONE = '0707894862'
const FALLBACK_HOTEL_EMAIL = 'jebalguesthouse@gmail.com'

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

function normalizePaymentStatus(status) {
  const value = String(status || '').toLowerCase()

  if (value.includes('paid') || value.includes('success') || value.includes('complete')) return 'Paid'
  if (value.includes('fail') || value.includes('cancel') || value.includes('declin') || value.includes('reject')) return 'Failed'
  return 'Pending'
}

function normalizeBookingStatus(status, paymentStatus) {
  const bookingValue = String(status || '').toLowerCase()
  const paymentValue = normalizePaymentStatus(paymentStatus)

  if (bookingValue.includes('confirm') || bookingValue.includes('booked')) return 'Confirmed'
  if (bookingValue.includes('cancel') || bookingValue.includes('expire') || bookingValue.includes('fail') || paymentValue === 'Failed') return 'Not Booked'
  if (paymentValue === 'Paid') return 'Confirmed'
  return 'Awaiting Payment'
}

function statusBadgeClass(status) {
  if (status === 'Paid' || status === 'Confirmed') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'Failed' || status === 'Not Booked' || status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-yellow-200 bg-yellow-50 text-yellow-700'
}

function shortStatusLabel(status) {
  return String(status || 'Pending').toUpperCase()
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : 1
}

function cleanContactValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function getBookingNumber(bill, orderId) {
  if (bill?.id) return `BK-${String(bill.id).padStart(6, '0')}`
  return orderId || 'booking-bill'
}

function getPdfFileName(bill, orderId) {
  return `Booking_${getBookingNumber(bill, orderId)}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

async function imageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
}


function pdfText(value) {
  return String(value ?? '-')
    .replace(/[‐-―−]/g, '-')
    .replace(/[→⟶➔]/g, ' to ')
    .replace(/[•]/g, '-')
    .replace(/[ ]/g, ' ')
    .replace(/[^ -~]/g, '')
}

function stayDateRange(checkIn, checkOut) {
  return `${checkIn || '-'} to ${checkOut || '-'}`
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds || 0)))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours} hr ${minutes} min ${remainingSeconds} sec`
  }

  if (minutes > 0) {
    return `${minutes} min ${remainingSeconds} sec`
  }

  return `${remainingSeconds} sec`
}

function drawPdfBox(pdf, x, y, width, height, options = {}) {
  const {
    fill = [248, 250, 252],
    border = [226, 232, 240],
    radius = 3,
  } = options

  pdf.setFillColor(...fill)
  pdf.setDrawColor(...border)
  pdf.roundedRect(x, y, width, height, radius, radius, 'FD')
}

export default function BookingBill() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id') || ''
  const orderId = searchParams.get('order_id') || ''
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bill, setBill] = useState(null)
  const [contactSettings, setContactSettings] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [retryBusy, setRetryBusy] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

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
      setSecondsRemaining(Number(result.booking?.seconds_remaining || 0))
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load booking bill.')
    } finally {
      setLoading(false)
    }
  }, [bookingId, orderId, statusUrl, token])

  const loadContactSettings = useCallback(async () => {
    try {
      const response = await fetch(CONTACT_SETTINGS_API_URL, { headers: { Accept: 'application/json' } })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load contact settings.')
      }

      setContactSettings(result.data || null)
    } catch (err) {
      console.warn('Contact settings fallback used:', err)
      setContactSettings(null)
    }
  }, [])

  useEffect(() => {
    loadBill()
  }, [loadBill])

  useEffect(() => {
    loadContactSettings()
  }, [loadContactSettings])

  useEffect(() => {
    if (!bill || bill.payment_status !== 'Payment Pending') return
    const timer = window.setInterval(loadBill, 5000)
    return () => window.clearInterval(timer)
  }, [bill, loadBill])

  useEffect(() => {
    if (!bill || bill.payment_status !== 'Payment Pending') return undefined
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [bill])

  if (!bookingId || !orderId || !token) {
    return <Navigate to="/rooms" replace />
  }

  const hotelName = cleanContactValue(contactSettings?.business_name)
    || cleanContactValue(contactSettings?.hotel_name)
    || cleanContactValue(contactSettings?.name)
    || cleanContactValue(bill?.hotel_name)
    || FALLBACK_HOTEL_NAME

  const hotelPhone = cleanContactValue(contactSettings?.phone)
    || cleanContactValue(contactSettings?.reception_contact_number)
    || cleanContactValue(contactSettings?.whatsapp_reservation_number)
    || cleanContactValue(contactSettings?.contact_number)
    || cleanContactValue(bill?.hotel_phone)
    || cleanContactValue(bill?.contact_phone)
    || FALLBACK_HOTEL_PHONE

  const hotelEmail = cleanContactValue(contactSettings?.email)
    || cleanContactValue(contactSettings?.contact_email)
    || cleanContactValue(bill?.hotel_email)
    || cleanContactValue(bill?.contact_email)
    || FALLBACK_HOTEL_EMAIL

  const roomTotal = Number(bill?.amount || 0)
  const roomPaid = bill?.payment_status === 'Paid' ? roomTotal : 0
  const roomBalance = Math.max(roomTotal - roomPaid, 0)
  const nights = bill ? nightsBetween(bill.check_in_date, bill.check_out_date) : 1
  const bookingNumber = getBookingNumber(bill, orderId)
  const generatedAt = formatDateTime(new Date().toISOString())
  const paymentHistory = Array.isArray(bill?.payment_history) ? bill.payment_history : []
  const displayPaymentStatus = normalizePaymentStatus(bill?.payment_status)
  const displayBookingStatus = normalizeBookingStatus(bill?.booking_status, bill?.payment_status)

  const createBillPdfBlob = async () => {
    if (!bill) throw new Error('Bill data is not ready.')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const logoBase64 = await imageToBase64(logo)

    pdf.setFillColor(90, 43, 12)
    pdf.rect(0, 0, pageWidth, 36, 'F')

    if (logoBase64) {
      pdf.addImage(logoBase64, 'PNG', margin, 8, 18, 18)
    }

    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(pdfText(hotelName), logoBase64 ? margin + 23 : margin, 16)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(pdfText(`${hotelPhone} - ${hotelEmail}`), logoBase64 ? margin + 23 : margin, 23)

    pdf.setFontSize(9)
    pdf.text(pdfText(`Generated: ${generatedAt}`), pageWidth - margin, 14, { align: 'right' })
    pdf.text(pdfText(`Booking ID: ${bookingNumber}`), pageWidth - margin, 21, { align: 'right' })

    let y = 46

    if (bill.payment_status === 'Payment Pending') {
      drawPdfBox(pdf, margin, y, contentWidth, 12, {
        fill: [254, 252, 232],
        border: [254, 240, 138],
      })
      pdf.setTextColor(133, 77, 14)
      pdf.setFontSize(9)
      pdf.text('Payment notification is still being verified. Complete payment soon to keep this room reserved.', margin + 4, y + 8)
      y += 18
    }

    if (bill.payment_status === 'Failed' || bill.payment_status === 'Cancelled') {
      drawPdfBox(pdf, margin, y, contentWidth, 12, {
        fill: [254, 242, 242],
        border: [254, 202, 202],
      })
      pdf.setTextColor(185, 28, 28)
      pdf.setFontSize(9)
      pdf.text('Payment was not completed. You can retry payment if the room is still available.', margin + 4, y + 8)
      y += 18
    }

    const cardGap = 4
    const cardWidth = (contentWidth - cardGap * 2) / 3
    const cardHeight = 45

    drawPdfBox(pdf, margin, y, cardWidth, cardHeight)
    drawPdfBox(pdf, margin + cardWidth + cardGap, y, cardWidth, cardHeight)
    drawPdfBox(pdf, margin + (cardWidth + cardGap) * 2, y, cardWidth, cardHeight)

    pdf.setTextColor(100, 116, 139)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('GUEST', margin + 5, y + 8)
    pdf.text('STAY', margin + cardWidth + cardGap + 5, y + 8)
    pdf.text('STATUS', margin + (cardWidth + cardGap) * 2 + 5, y + 8)

    pdf.setTextColor(15, 23, 42)
    pdf.setFontSize(10)
    pdf.text(pdfText(bill.full_name || '-'), margin + 5, y + 20)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(pdfText(`Phone: ${bill.phone || '-'}`), margin + 5, y + 27)
    pdf.text(pdfText(`Email: ${bill.email || '-'}`), margin + 5, y + 34, { maxWidth: cardWidth - 10 })

    const stayX = margin + cardWidth + cardGap + 5
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(pdfText(stayDateRange(bill.check_in_date, bill.check_out_date)), stayX, y + 20)
    pdf.setFont('helvetica', 'normal')
    pdf.text(pdfText(`${nights} night${nights === 1 ? '' : 's'} - Guests: ${bill.guests || 1}`), stayX, y + 27)
    pdf.text(pdfText(`Room: ${bill.room_name || '-'}`), stayX, y + 34, { maxWidth: cardWidth - 10 })
    pdf.text(pdfText(`Method: ${bill.payment_method || 'PayHere'}`), stayX, y + 41)

    const payX = margin + (cardWidth + cardGap) * 2 + 5
    pdf.setTextColor(100, 116, 139)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('BOOKING', payX, y + 20)
    pdf.setTextColor(15, 23, 42)
    pdf.setFontSize(10)
    pdf.text(pdfText(shortStatusLabel(displayBookingStatus)), payX + 22, y + 20)

    pdf.setTextColor(100, 116, 139)
    pdf.setFontSize(8)
    pdf.text('PAYMENT', payX, y + 33)
    pdf.setTextColor(15, 23, 42)
    pdf.setFontSize(10)
    pdf.text(pdfText(shortStatusLabel(displayPaymentStatus)), payX + 22, y + 33)

    y += cardHeight + 10

    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 3,
        textColor: [15, 23, 42],
      },
      body: [
        ['Total Charges', formatMoney(roomTotal, bill.currency)],
        ['Paid', formatMoney(roomPaid, bill.currency)],
        ['Balance', formatMoney(roomBalance, bill.currency)],
      ],
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.row.index === 0) data.cell.styles.textColor = [90, 43, 12]
        if (data.column.index === 1 && data.row.index === 1) data.cell.styles.textColor = [21, 128, 61]
        if (data.column.index === 1 && data.row.index === 2) data.cell.styles.textColor = [220, 38, 38]
      },
      didDrawPage: () => {
        pdf.setDrawColor(226, 232, 240)
        pdf.roundedRect(margin, y - 1, contentWidth, 29, 3, 3)
      },
    })

    y = pdf.lastAutoTable.finalY + 12

    drawPdfBox(pdf, margin, y, contentWidth, 40, {
      fill: [255, 255, 255],
      border: [226, 232, 240],
    })

    pdf.setTextColor(15, 23, 42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text('Notes:', margin + 5, y + 9)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(51, 65, 85)
    pdf.text('- Please keep this bill for your records.', margin + 8, y + 18)
    pdf.text('- The room is booked from check-in day morning 11:30 AM to check-out day morning 11:00 AM.', margin + 8, y + 25)
    pdf.text(pdfText(`- For billing queries, contact the front desk at ${hotelPhone}.`), margin + 8, y + 32)

    return pdf.output('blob')
  }

  const handleDownloadBill = async () => {
    if (!bill || pdfBusy) return

    try {
      setPdfBusy(true)
      const blob = await createBillPdfBlob()
      const fileName = getPdfFileName(bill, orderId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Unable to download bill PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  const handleRetryPayment = async () => {
    if (!bill || retryBusy) return

    try {
      setRetryBusy(true)
      setError('')

      const response = await fetch(PAYMENT_INIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ booking_id: bill.id }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to restart payment.')
      }

      if (!result.checkout_url) {
        throw new Error('Payment checkout URL was not returned.')
      }

      window.location.href = result.checkout_url
    } catch (err) {
      setError(err.message || 'Unable to restart payment.')
    } finally {
      setRetryBusy(false)
    }
  }

  const handleShare = async () => {
    if (!bill || pdfBusy) return

    try {
      setPdfBusy(true)
      const blob = await createBillPdfBlob()
      const fileName = getPdfFileName(bill, orderId)
      const file = new File([blob], fileName, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: `${hotelName} Booking Bill`,
          text: `${hotelName} booking bill - ${bill.room_name} - ${bill.payment_status}`,
          files: [file],
        })
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      alert('PDF file sharing is not supported in this browser. The bill PDF was downloaded instead.')
    } catch (err) {
      alert(err.message || 'Unable to share bill PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  const brownText = 'text-[#5a2b0c]'
  const brownBg = 'bg-[#7a3d0f]'
  const brownHover = 'hover:bg-[#5f2f0b]'
  const softPanel = 'border-[#eaded3] bg-white/92 shadow-[0_14px_35px_rgba(90,43,12,0.06)]'

  const DetailRow = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 text-[13px] leading-5 sm:text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="max-w-[58%] text-right font-extrabold text-slate-950">{value || '-'}</span>
    </div>
  )

  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4eee8] text-[#7a3d0f] ring-1 ring-[#eaded3] sm:h-11 sm:w-11">
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <h2 className="text-sm font-black uppercase tracking-wide text-[#5a2b0c] sm:text-base">{title}</h2>
    </div>
  )

  const CompactContact = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-3 text-xs text-slate-800 sm:text-sm">
      <Icon size={15} className="shrink-0 text-[#7a3d0f]" />
      <span className="break-all">{children || '-'}</span>
    </div>
  )

  return (
    <PageTransition>
      <section className="min-h-screen bg-[#f7f3ef] py-6 print:bg-white print:py-0 sm:py-10">
        <div className="mx-auto max-w-6xl px-3 sm:px-5 print:max-w-none print:px-0">
          <FadeUp>
            <Link
              to="/rooms"
              className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7a3d0f] hover:text-[#4b2209] print:hidden"
            >
              <ArrowLeft size={14} />
              Back to Rooms
            </Link>

            {loading ? (
              <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
                <Clock className="mx-auto mb-4 text-[#7a3d0f]" size={34} />
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
                <div id="booking-bill-print-area" className="relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-[#eaded3] bg-white shadow-[0_24px_80px_rgba(73,38,14,0.16)] print:rounded-none print:border-0 print:shadow-none">
                  <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(122,61,15,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(122,61,15,0.06),transparent_30%)]" />
                  <img
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden w-[430px] -translate-x-1/2 -translate-y-1/2 opacity-[0.035] grayscale sm:block print:opacity-[0.05]"
                  />

                  <div className="relative z-10 border-b-2 border-[#7a3d0f] px-5 py-6 sm:px-10 sm:py-8">
                    <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-[#eaded3] sm:h-24 sm:w-24">
                          <img src={logo} alt={hotelName} className="h-full w-full object-contain p-1" />
                        </div>
                        <div>
                          <h1 className="font-serif text-4xl font-black uppercase leading-none tracking-[0.18em] text-[#5a2b0c] sm:text-5xl">Jebal</h1>
                          <p className="mt-1 text-lg font-semibold uppercase tracking-[0.34em] text-[#5a2b0c] sm:text-xl">Guest House</p>
                          <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-[#7a3d0f] lg:justify-start">
                            <span className="h-px w-10 bg-[#b88962]" />
                            Comfortable Guest House
                            <span className="h-px w-10 bg-[#b88962]" />
                          </div>
                        </div>
                      </div>

                      <div className="lg:text-right">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-[#5a2b0c] sm:text-3xl">Bill / Invoice</h2>
                        <p className="mt-2 text-sm text-slate-700">Generated on: {generatedAt}</p>
                        <div className="mt-4 inline-flex rounded-lg bg-[#f3ebe3] px-6 py-2 text-sm font-black text-[#5a2b0c]">
                          Booking ID: {bookingNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 px-4 py-5 sm:px-8 sm:py-8">
                    {bill.payment_status === 'Payment Pending' && (
                      <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
                        Payment notification is still being verified. Complete payment within {formatCountdown(secondsRemaining)} to keep this room reserved.
                      </div>
                    )}

                    {(bill.payment_status === 'Failed' || bill.payment_status === 'Cancelled') && (
                      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                        Payment was not completed. You can retry payment if the room is still available.
                      </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-3">
                      <section className={`rounded-lg border p-5 ${softPanel}`}>
                        <SectionTitle icon={UserRound} title="Guest Details" />
                        <div className="hidden space-y-4 sm:block">
                          <div>
                            <p className="text-sm text-slate-600">Guest Name</p>
                            <p className="mt-1 font-black text-slate-950">{bill.full_name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Phone</p>
                            <p className="mt-1 font-black text-slate-950">{bill.phone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Email</p>
                            <p className="mt-1 break-all font-black text-slate-950">{bill.email || '-'}</p>
                          </div>
                        </div>
                        <div className="space-y-3 sm:hidden">
                          <CompactContact icon={UserRound}>{bill.full_name}</CompactContact>
                          <CompactContact icon={Phone}>{bill.phone}</CompactContact>
                          <CompactContact icon={Mail}>{bill.email}</CompactContact>
                        </div>
                      </section>

                      <section className={`rounded-lg border p-5 ${softPanel}`}>
                        <SectionTitle icon={CalendarDays} title="Stay Details" />
                        <div className="space-y-4">
                          <DetailRow label="Check-in" value={bill.check_in_date} />
                          <DetailRow label="Check-out" value={bill.check_out_date} />
                          <DetailRow label="Nights" value={`${nights} Night${nights === 1 ? '' : 's'}`} />
                          <DetailRow label="Guests" value={`${bill.guests || 1} Guest${Number(bill.guests || 1) === 1 ? '' : 's'}`} />
                          <DetailRow label="Room" value={bill.room_name} />
                        </div>
                      </section>

                      <section className={`rounded-lg border p-5 ${softPanel}`}>
                        <SectionTitle icon={Bookmark} title="Booking Status" />
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-700">Booking Status</span>
                            <span className={`min-w-[115px] rounded-md border px-3 py-1 text-center text-xs font-black ${statusBadgeClass(displayBookingStatus)}`}>{shortStatusLabel(displayBookingStatus)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-slate-700">Payment Status</span>
                            <span className={`min-w-[90px] rounded-md border px-3 py-1 text-center text-xs font-black ${statusBadgeClass(displayPaymentStatus)}`}>{shortStatusLabel(displayPaymentStatus)}</span>
                          </div>
                          <DetailRow label="Payment Method" value={bill.payment_method || 'PayHere'} />
                        </div>
                      </section>
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.08fr]">
                      <section className={`overflow-hidden rounded-lg border ${softPanel}`}>
                        <div className="p-5 pb-0">
                          <SectionTitle icon={FileText} title="Bill Summary" />
                        </div>
                        <div className="grid grid-cols-[1fr_auto] bg-[#f4eee8] px-5 py-4 text-xs font-black uppercase text-slate-800">
                          <span>Description</span>
                          <span>Amount</span>
                        </div>
                        <div className="divide-y divide-[#eaded3] text-sm">
                          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-5">
                            <span>Room Charge ({nights} Night{nights === 1 ? '' : 's'})</span>
                            <span className="font-black text-slate-950">{formatMoney(roomTotal, bill.currency)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-5 font-black">
                            <span>TOTAL CHARGES</span>
                            <span>{formatMoney(roomTotal, bill.currency)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-5 font-black text-green-700">
                            <span>PAID</span>
                            <span>{formatMoney(roomPaid, bill.currency)}</span>
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-4 bg-[#f3ebe3] px-5 py-5 font-black text-[#7a3d0f]">
                            <span>BALANCE</span>
                            <span>{formatMoney(roomBalance, bill.currency)}</span>
                          </div>
                        </div>
                      </section>

                      <div className="space-y-5">
                        <section className={`rounded-lg border p-5 ${softPanel}`}>
                          <SectionTitle icon={RotateCcw} title="Payment History" />
                          {paymentHistory.length > 0 ? (
                            <div className="space-y-3">
                              {paymentHistory.map((payment) => (
                                <div key={`${payment.attempt}-${payment.order_id}`} className="grid gap-3 rounded-lg border border-[#eaded3] bg-white p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClass(normalizePaymentStatus(payment.status))}`}>
                                    {shortStatusLabel(normalizePaymentStatus(payment.status))}
                                  </span>
                                  <div>
                                    <p className="text-sm font-black text-slate-950">Payment Attempt {payment.attempt}</p>
                                    <p className="mt-1 break-all text-xs text-slate-500">Order ID: {payment.order_id || '-'}</p>
                                    <p className="text-xs text-slate-500">{formatDateTime(payment.created_at)}</p>
                                  </div>
                                  <p className="text-right text-sm font-black text-slate-950 sm:text-base">{formatMoney(payment.amount, payment.currency)}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="rounded-lg border border-[#eaded3] bg-white p-4 text-sm text-slate-600">No payment attempts found yet.</p>
                          )}
                        </section>

                        <section className={`hidden rounded-lg border p-5 lg:block ${softPanel}`}>
                          <SectionTitle icon={FileText} title="Notes" />
                          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                            <li>Please keep this bill for your records.</li>
                            <li>The room is booked from check-in day morning 11:30 AM to check-out day morning 11:00 AM.</li>
                            <li>For billing queries, contact the front desk at {hotelPhone}.</li>
                          </ul>
                        </section>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row print:hidden">
                      {bill.can_retry_payment && (
                        <button type="button" onClick={handleRetryPayment} disabled={retryBusy} className={`inline-flex items-center justify-center gap-2 rounded-md ${brownBg} px-8 py-3 text-sm font-black text-white shadow-sm ${brownHover} disabled:cursor-not-allowed disabled:opacity-70`}>
                          {retryBusy ? 'Starting Payment...' : bill.payment_status === 'Payment Pending' ? 'Resume Payment' : 'Retry Payment'}
                        </button>
                      )}

                      <button type="button" onClick={handleDownloadBill} disabled={pdfBusy} className={`inline-flex items-center justify-center gap-2 rounded-md ${brownBg} px-8 py-3 text-sm font-black text-white shadow-sm ${brownHover} disabled:cursor-not-allowed disabled:opacity-70`}>
                        <Download size={16} />
                        {pdfBusy ? 'Preparing PDF...' : 'Download Bill (PDF)'}
                      </button>

                      <button type="button" onClick={handleShare} disabled={pdfBusy} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#b88962] bg-white px-8 py-3 text-sm font-black text-[#5a2b0c] shadow-sm hover:bg-[#f8f1eb] disabled:cursor-not-allowed disabled:opacity-70">
                        <Share2 size={16} />
                        Share Bill
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 border-t border-[#eaded3] bg-[#fbf8f5] px-5 py-6 sm:px-10 print:hidden">
                    <div className="grid gap-5 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr_1fr] lg:items-center">
                      <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f4eee8] text-[#7a3d0f]">
                          <Headphones size={25} />
                        </span>
                        <div>
                          <p className="font-black text-slate-950">Need help?</p>
                          <p className="text-sm text-slate-600">We're here to assist you.</p>
                        </div>
                        <ChevronDown className="ml-auto text-[#7a3d0f] sm:hidden" size={17} />
                      </div>
                      <div className="space-y-3 text-sm text-slate-700">
                        <CompactContact icon={Phone}>{hotelPhone}</CompactContact>
                        <CompactContact icon={Mail}>{hotelEmail}</CompactContact>
                      </div>
                      <div className="space-y-3 text-sm text-slate-700 sm:col-span-2 lg:col-span-1">
                        <CompactContact icon={Globe2}>www.jebalguesthouse.com</CompactContact>
                        <CompactContact icon={MapPin}>Jaffna, Sri Lanka</CompactContact>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 bg-gradient-to-r from-[#3d1f0d] to-[#5a2b0c] px-5 py-6 text-center text-sm text-white sm:px-10">
                    <p>Thank you for choosing Jebal Guest House.</p>
                    <p className="mt-2 text-[#f2c8ad]">❤</p>
                    <p className="mt-3">© 2026 Jebal Guest House. All rights reserved.</p>
                  </div>
                </div>
              </>
            )}
          </FadeUp>
        </div>
      </section>
    </PageTransition>
  )
}
