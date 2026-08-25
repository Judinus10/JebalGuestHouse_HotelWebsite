import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Bookmark, CalendarDays, CheckCircle2, ChevronDown, Clock, Download, FileText, Globe2, Headphones, Mail, MapPin, Phone, RotateCcw, Share2, UserRound } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import Button from '../components/ui/Button'
import logo from '../assets/logo.png'
import bookingBillBanner from '../assets/images/banners/booking-bill-banner.webp'
import { API_BASE_URL } from '../services/config'
import { publicErrorMessage, requestJson } from '../services/publicErrors'
import { useToast } from '../components/ui/ToastProvider'

const PAYMENT_STATUS_API_URL = `${API_BASE_URL}/payments/status.php`
const PAYMENT_INIT_API_URL = `${API_BASE_URL}/payments/create-checkout-session.php`
const CONTACT_SETTINGS_API_URL = `${API_BASE_URL}/settings/get-contact.php`
const EMAIL_ICON_BASE_URL = `${API_BASE_URL}/mail/assets/email-icons`

const FALLBACK_HOTEL_NAME = 'Jebal Guest House'
const FALLBACK_HOTEL_PHONE = '+31 6 28324956'
const FALLBACK_HOTEL_SECONDARY_PHONE = '+94 77 951 8657'
const FALLBACK_HOTEL_EMAIL = 'info@jebalguesthouse.com'
const FALLBACK_HOTEL_ADDRESS = 'Old Church Road (near the RC School)\nUyarappulam\nAnnaicoddai\nJaffna\nSri Lanka'

function formatMoney(amount, currency = 'USD') {
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

function formatDateOnly(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatTimeOnly(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, {
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

function isOnlinePaymentMethod(value) {
  const method = cleanContactValue(value).toLowerCase()
  return method.includes('payhere') || method.includes('online')
}

function getBookingNumber(bill, orderId) {
  if (bill?.booking_no) return bill.booking_no
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


function getBillReference(bill, bookingNumber) {
  return cleanContactValue(bill?.invoice_number)
    || cleanContactValue(bill?.payment_invoice_number)
    || `BILL-${bookingNumber}`
}

function getPaymentReference(bill, paymentHistory = []) {
  const latestWithReference = [...paymentHistory]
    .reverse()
    .find((payment) => cleanContactValue(payment.payment_id) || cleanContactValue(payment.order_id))

  return cleanContactValue(bill?.payment_id)
    || cleanContactValue(latestWithReference?.payment_id)
    || cleanContactValue(bill?.order_id)
    || cleanContactValue(latestWithReference?.order_id)
    || '-'
}

function drawPdfLabelValue(pdf, label, value, x, y, width, options = {}) {
  const { labelColor = [100, 116, 139], valueColor = [15, 23, 42], valueSize = 9 } = options
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...labelColor)
  pdf.text(pdfText(label), x, y)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(valueSize)
  pdf.setTextColor(...valueColor)
  const lines = pdf.splitTextToSize(pdfText(value || '-'), width)
  pdf.text(lines, x, y + 5)
  return y + 5 + lines.length * 5
}

export default function BookingBill() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id') || ''
  const orderId = searchParams.get('order_id') || ''
  const token = searchParams.get('token') || ''
  const bookingSuccessKey = `jebal_booking_success:${bookingId || orderId}`
  const [showBookingSuccess] = useState(() => {
    if (searchParams.get('booking_success') === '1') return true
    if (!bookingId && !orderId) return false
    return window.sessionStorage.getItem(bookingSuccessKey) === '1'
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bill, setBill] = useState(null)
  const [contactSettings, setContactSettings] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [retryBusy, setRetryBusy] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [openMobileSection, setOpenMobileSection] = useState('')

  useEffect(() => {
    if (error) toast.error(error)
  }, [error, toast])

  useEffect(() => {
    if (!showBookingSuccess || !bill) return

    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('booking_success')
    window.history.replaceState(window.history.state, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`)
    window.sessionStorage.removeItem(bookingSuccessKey)
  }, [bill, bookingSuccessKey, showBookingSuccess])

  useEffect(() => {
    if (bill?.payment_status === 'Failed' || bill?.payment_status === 'Cancelled') {
      toast.warning('Payment was not completed. You may retry while the room remains available.')
    }
  }, [bill?.payment_status, toast])

  const statusUrl = useMemo(() => {
    const params = new URLSearchParams({ booking_id: bookingId, order_id: orderId, token })
    return `${PAYMENT_STATUS_API_URL}?${params.toString()}`
  }, [bookingId, orderId, token])

  const loadBill = useCallback(async () => {
    if (!bookingId || !orderId || !token) return

    try {
      const result = await requestJson(statusUrl, { headers: { Accept: 'application/json' } }, 'bill')

      setBill(result.booking)
      setSecondsRemaining(Number(result.booking?.seconds_remaining || 0))
      setError('')
    } catch (err) {
      setError(publicErrorMessage(err, 'bill'))
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
    const refreshInterval = isOnlinePaymentMethod(bill.payment_method)
      ? 15 * 1000
      : 7 * 60 * 1000
    const timer = window.setInterval(loadBill, refreshInterval)
    return () => window.clearInterval(timer)
  }, [bill, loadBill])

  useEffect(() => {
    if (!bill || bill.payment_status !== 'Payment Pending' || !isOnlinePaymentMethod(bill.payment_method)) return undefined
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

  const hotelSecondaryPhone = cleanContactValue(contactSettings?.reception_contact_number)
    || FALLBACK_HOTEL_SECONDARY_PHONE
  const hotelAddress = cleanContactValue(contactSettings?.address) || FALLBACK_HOTEL_ADDRESS
  const hotelAddressLines = hotelAddress
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const hotelMapsUrl = cleanContactValue(contactSettings?.google_maps_url)
  const hotelPhoneLine = [hotelPhone, hotelSecondaryPhone].filter((value, index, values) => value && values.indexOf(value) === index).join(' | ')

  const roomTotal = Number(bill?.amount || 0)
  const roomPaid = bill?.payment_status === 'Paid' ? roomTotal : 0
  const roomBalance = Math.max(roomTotal - roomPaid, 0)
  const nights = bill ? nightsBetween(bill.check_in_date, bill.check_out_date) : 1
  const bookingNumber = getBookingNumber(bill, orderId)
  const paymentHistory = Array.isArray(bill?.payment_history) ? bill.payment_history : []
  const bookedRooms = Array.isArray(bill?.rooms) ? bill.rooms : []
  const displayPaymentStatus = normalizePaymentStatus(bill?.payment_status)
  const displayBookingStatus = normalizeBookingStatus(bill?.booking_status, bill?.payment_status)

  const createBillPdfBlob = async () => {
    if (!bill) throw new Error('Bill data is not ready.')

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const [logoBase64, phoneIconBase64, mailIconBase64, locationIconBase64] = await Promise.all([
      imageToBase64(logo),
      imageToBase64(`${EMAIL_ICON_BASE_URL}/phone.png`),
      imageToBase64(`${EMAIL_ICON_BASE_URL}/mail.png`),
      imageToBase64(`${EMAIL_ICON_BASE_URL}/location.png`),
    ])
    const billReference = getBillReference(bill, bookingNumber)
    const paymentReference = getPaymentReference(bill, paymentHistory)
    const currentPayment = paymentHistory[paymentHistory.length - 1] || {}
    const currency = bill.currency || currentPayment.currency || 'USD'
    const paymentMethod = bill.payment_method || currentPayment.method || 'PayHere'

    const safePaymentReference = pdfText(paymentReference)
    const wrappedPaymentRef = pdf.splitTextToSize(safePaymentReference, 62)
    const paymentRefText = wrappedPaymentRef.slice(0, 2)

    const addFooter = () => {
      const footerHeight = 14
      const footerTop = pageHeight - footerHeight
      pdf.setFillColor(61, 31, 13)
      pdf.rect(0, footerTop, pageWidth, footerHeight, 'F')
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.5)
      pdf.setTextColor(255, 255, 255)
      pdf.text('Thank you for choosing Jebal Guest House.', pageWidth / 2, footerTop + 8.5, { align: 'center' })

      return footerTop
    }

    const sectionTitle = (title, x, y) => {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(90, 43, 12)
      pdf.text(title, x, y)
    }

    const drawMiniLabel = (label, value, x, y, width, options = {}) => {
      const { valueColor = [15, 23, 42], valueSize = 8.2 } = options
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.3)
      pdf.setTextColor(100, 116, 139)
      pdf.text(pdfText(label), x, y)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(valueSize)
      pdf.setTextColor(...valueColor)
      const lines = pdf.splitTextToSize(pdfText(value || '-'), width)
      pdf.text(lines.slice(0, 2), x, y + 4.8)
    }

    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')

    const drawWatermarkLogo = () => {
      if (!logoBase64) return

      const watermarkSize = 86
      const watermarkX = (pageWidth - watermarkSize) / 2
      const watermarkY = 102

      try {
        pdf.saveGraphicsState()
        pdf.setGState(new pdf.GState({ opacity: 0.045 }))
        pdf.addImage(logoBase64, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize)
        pdf.restoreGraphicsState()
      } catch (error) {
        // Older jsPDF builds can miss GState support. Keep the PDF working.
      }
    }

    const addContactIcon = (iconData, x, y, size = 4.5) => {
      if (!iconData) return
      pdf.addImage(iconData, 'PNG', x, y, size, size)
    }

    // Header: property identity and contact details are kept together at the top.
    drawPdfBox(pdf, margin, 11, contentWidth, 52, {
      fill: [255, 255, 255],
      border: [234, 222, 211],
      radius: 2,
    })

    if (logoBase64) {
      pdf.addImage(logoBase64, 'PNG', margin + 6, 18, 24, 24)
    }

    pdf.setTextColor(90, 43, 12)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(23)
    pdf.text('J E B A L', margin + 36, 26)
    pdf.setFontSize(13)
    pdf.text('G U E S T  H O U S E', margin + 36, 35)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text('Comfortable Guest House', margin + 37, 42)

    // Keep the references below the property branding as secondary information.
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.setFontSize(7)
    pdf.text(pdfText(`Booking Ref: ${bookingNumber}`), margin + 6, 51)
    pdf.text(pdfText(`Bill Ref: ${billReference}`), margin + 6, 57)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text('BILL / INVOICE', pageWidth - margin - 6, 20, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(71, 85, 105)
    pdf.setFontSize(6.8)
    const pdfAddressLines = hotelAddressLines.map((line) => pdfText(line))
    const addressRightX = pageWidth - margin - 6
    const widestAddressLine = Math.max(0, ...pdfAddressLines.map((line) => pdf.getTextWidth(line)))
    addContactIcon(locationIconBase64, addressRightX - widestAddressLine - 4.4, 26.2, 3.2)
    pdf.text(pdfAddressLines, addressRightX, 29, {
      align: 'right',
      lineHeightFactor: 1.18,
      maxWidth: 66,
    })

    // Phone and email sit directly below the address on the right.
    const phoneText = pdfText(hotelPhoneLine)
    const emailText = pdfText(hotelEmail)
    const phoneTextWidth = pdf.getTextWidth(phoneText)
    const emailTextWidth = pdf.getTextWidth(emailText)
    addContactIcon(phoneIconBase64, addressRightX - phoneTextWidth - 4.4, 46.3, 3.2)
    addContactIcon(mailIconBase64, addressRightX - emailTextWidth - 4.4, 52.4, 3.2)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.8)
    pdf.setTextColor(71, 85, 105)
    pdf.text(phoneText, addressRightX, 49, { align: 'right' })
    pdf.text(emailText, addressRightX, 55.2, { align: 'right' })

    pdf.setDrawColor(122, 61, 15)
    pdf.setLineWidth(0.6)
    pdf.line(margin, 68, pageWidth - margin, 68)

    let y = 74
    const cardGap = 5
    const cardWidth = (contentWidth - cardGap * 2) / 3
    const cardHeight = 58

    drawPdfBox(pdf, margin, y, cardWidth, cardHeight, { fill: [255, 255, 255], border: [234, 222, 211], radius: 2 })
    drawPdfBox(pdf, margin + cardWidth + cardGap, y, cardWidth, cardHeight, { fill: [255, 255, 255], border: [234, 222, 211], radius: 2 })
    drawPdfBox(pdf, margin + (cardWidth + cardGap) * 2, y, cardWidth, cardHeight, { fill: [255, 255, 255], border: [234, 222, 211], radius: 2 })

    sectionTitle('GUEST DETAILS', margin + 5, y + 9)
    drawMiniLabel('Guest Name', bill.full_name || '-', margin + 5, y + 18, cardWidth - 10)
    drawMiniLabel('Phone', bill.phone || '-', margin + 5, y + 30, cardWidth - 10)
    drawMiniLabel('Email', bill.email || '-', margin + 5, y + 42, cardWidth - 10, { valueSize: 7.6 })

    const stayX = margin + cardWidth + cardGap
    sectionTitle('STAY DETAILS', stayX + 5, y + 9)
    drawMiniLabel('Check-in / Check-out', stayDateRange(bill.check_in_date, bill.check_out_date), stayX + 5, y + 18, cardWidth - 10, { valueSize: 7.8 })
    drawMiniLabel('Nights / Guests', `${nights} Night${nights === 1 ? '' : 's'} | ${bill.guests || 1} Guest${Number(bill.guests || 1) === 1 ? '' : 's'}`, stayX + 5, y + 30, cardWidth - 10, { valueSize: 7.8 })
    drawMiniLabel('Room', bill.room_name || '-', stayX + 5, y + 42, cardWidth - 10, { valueSize: 7.6 })

    const statusX = margin + (cardWidth + cardGap) * 2
    sectionTitle('BOOKING STATUS', statusX + 5, y + 9)
    drawMiniLabel('Booking Status', shortStatusLabel(displayBookingStatus), statusX + 5, y + 18, cardWidth - 10, {
      valueColor: displayBookingStatus === 'Confirmed' ? [21, 128, 61] : displayBookingStatus === 'Not Booked' ? [185, 28, 28] : [133, 77, 14],
    })
    drawMiniLabel('Payment Status', shortStatusLabel(displayPaymentStatus), statusX + 5, y + 30, cardWidth - 10, {
      valueColor: displayPaymentStatus === 'Paid' ? [21, 128, 61] : displayPaymentStatus === 'Failed' ? [185, 28, 28] : [133, 77, 14],
    })
    drawMiniLabel('Payment Method', paymentMethod, statusX + 5, y + 42, cardWidth - 10, { valueSize: 7.6 })

    y += cardHeight + 11

    const leftWidth = 103
    const rightX = margin + leftWidth + 7
    const rightWidth = contentWidth - leftWidth - 7
    const panelY = y
    const panelHeight = 96

    drawWatermarkLogo()

    drawPdfBox(pdf, margin, panelY, leftWidth, panelHeight, {
      fill: [255, 255, 255],
      border: [234, 222, 211],
      radius: 2,
    })
    sectionTitle('BILL SUMMARY', margin + 5, panelY + 10)

    autoTable(pdf, {
      startY: panelY + 17,
      margin: { left: margin, right: pageWidth - margin - leftWidth },
      tableWidth: leftWidth,
      theme: 'grid',
      head: [['DESCRIPTION', 'AMOUNT']],
      body: [
        [`Room Charge (${nights} Night${nights === 1 ? '' : 's'})`, formatMoney(roomTotal, currency)],
        ['TOTAL CHARGES', formatMoney(roomTotal, currency)],
        ['PAID', formatMoney(roomPaid, currency)],
        ['BALANCE', formatMoney(roomBalance, currency)],
      ],
      styles: {
        font: 'helvetica',
        fontSize: 8.3,
        cellPadding: 4.8,
        lineColor: [234, 222, 211],
        lineWidth: 0.2,
        textColor: [15, 23, 42],
        minCellHeight: 14,
      },
      headStyles: {
        fillColor: [244, 238, 232],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section !== 'body') return
        if (data.row.index === 1) data.cell.styles.fontStyle = 'bold'
        if (data.row.index === 2) data.cell.styles.textColor = [21, 128, 61]
        if (data.row.index === 3) {
          data.cell.styles.fillColor = [243, 235, 227]
          data.cell.styles.textColor = [90, 43, 12]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    drawPdfBox(pdf, rightX, panelY, rightWidth, 41, {
      fill: [255, 255, 255],
      border: [234, 222, 211],
      radius: 2,
    })
    sectionTitle('PAYMENT DETAILS', rightX + 5, panelY + 11)
    drawMiniLabel('Payment Method', paymentMethod, rightX + 5, panelY + 21, rightWidth - 10, { valueSize: 8 })
    drawMiniLabel('Payment Ref', paymentRefText.join('\n'), rightX + 5, panelY + 32, rightWidth - 10, { valueSize: 7.2 })

    drawPdfBox(pdf, rightX, panelY + 47, rightWidth, 49, {
      fill: [255, 255, 255],
      border: [234, 222, 211],
      radius: 2,
    })
    sectionTitle('NOTES', rightX + 5, panelY + 58)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.2)
    pdf.setTextColor(51, 65, 85)
    const notes = [
      'Please keep this bill for your records.',
      'The room is booked from 12:00 PM on the check-in date until 11:00 AM on the check-out date.',
      `For billing queries, contact us at ${hotelPhoneLine}.`,
    ]
    let noteY = panelY + 68
    notes.forEach((note) => {
      const lines = pdf.splitTextToSize(pdfText(note), rightWidth - 14)
      pdf.text('-', rightX + 5, noteY)
      pdf.text(lines, rightX + 9, noteY)
      noteY += lines.length * 4.1 + 2
    })


    const footerTop = addFooter()

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Page 1 of 1', pageWidth - margin, footerTop - 4, { align: 'right' })

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
      toast.success('Your booking bill was downloaded successfully.')
    } catch (err) {
      toast.error(err.message || 'Unable to download bill PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  const handleRetryPayment = async () => {
    if (!bill || retryBusy) return

    try {
      setRetryBusy(true)
      setError('')

      const result = await requestJson(PAYMENT_INIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ booking_id: bill.id }),
      }, 'payment')

      if (!result.checkout_url) {
        throw new Error('Payment checkout URL was not returned.')
      }

      window.location.href = result.checkout_url
    } catch (err) {
      setError(publicErrorMessage(err, 'payment'))
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
      toast.info('PDF sharing is not supported in this browser, so the bill was downloaded instead.')
    } catch (err) {
      toast.error(err.message || 'Unable to share bill PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  const accent = '#b67722'
  const bookingDate = paymentHistory[0]?.created_at || bill?.payment_updated_at || ''
  const paidInFull = displayPaymentStatus === 'Paid'

  const DetailBlock = ({ label, value }) => (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{value || '-'}</p>
    </div>
  )

  const SummaryItem = ({ icon: Icon, label, value, secondaryValue, badge }) => (
    <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        {badge ? (
          <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass(value)}`}>{value}</span>
        ) : (
          <div className="mt-1 text-sm font-semibold leading-5 text-slate-950">
            <p>{value || '-'}</p>
            {secondaryValue && <p className="text-xs font-medium text-slate-600">{secondaryValue}</p>}
          </div>
        )}
      </div>
    </div>
  )

  const MobileAccordion = ({ icon: Icon, title, sectionId, children }) => {
    const isOpen = openMobileSection === sectionId

    return (
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`mobile-${sectionId}-content`}
          onClick={() => setOpenMobileSection((current) => current === sectionId ? '' : sectionId)}
          className="flex w-full items-center justify-between bg-white px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <Icon size={16} className="text-amber-700" />
            <span className="font-serif text-sm font-semibold text-slate-900">{title}</span>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isOpen && (
          <div id={`mobile-${sectionId}-content`} className="border-t border-slate-200 px-4 py-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <PageTransition>
      <section className="min-h-screen bg-white print:bg-white">
        <FadeUp>
          {loading ? (
            <div className="mx-auto max-w-6xl px-4 py-24 text-center">
              <Clock className="mx-auto mb-4 text-amber-700" size={34} />
              <p className="font-serif text-3xl text-slate-900">Loading your booking bill...</p>
              <p className="mt-3 text-sm text-slate-500">Checking the latest payment status.</p>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-6xl px-4 py-24 text-center">
              <AlertTriangle className="mx-auto mb-4 text-red-600" size={34} />
              <p className="font-serif text-3xl text-slate-900">Bill not available</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={loadBill} className="bg-charcoal px-6 py-3 text-xs tracking-wider uppercase text-white">Try Again</button><Button to="/rooms">View Rooms</Button></div>
              <p className="mt-5 text-xs text-slate-500">For help, contact {FALLBACK_HOTEL_PHONE} or {FALLBACK_HOTEL_SECONDARY_PHONE}.</p>
            </div>
          ) : (
            <div id="booking-bill-print-area" className="bg-white">
              <div className="relative overflow-hidden bg-slate-900 print:hidden">
                <img
                  src={bookingBillBanner}
                  alt="Jebal Guest House room"
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                  width="1942"
                  height="809"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/45" />
                <div className="relative mx-auto flex min-h-[260px] max-w-7xl flex-col items-center justify-center px-5 py-14 text-center text-white sm:min-h-[320px]">
                  <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl">Booking Bill</h1>
                  <div className="my-5 h-px w-24 bg-white/60" />
                  <p className="max-w-xl text-sm leading-6 text-white/90 sm:text-base">Thank you for choosing {hotelName}. We look forward to welcoming you.</p>
                </div>
              </div>

              <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
                {showBookingSuccess && (
                  <div className="relative z-20 -mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium leading-6 text-green-900 shadow-sm sm:-mt-7 sm:px-5">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={20} />
                    <p>Booking request submitted successfully. The property will contact you to confirm your reservation. A confirmation email will be sent to your email address shortly.</p>
                  </div>
                )}

                <div className={`relative z-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.10)] ${showBookingSuccess ? 'mt-4' : '-mt-8 sm:-mt-10'}`}>
                  <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-[1fr_1fr_1fr_1fr_1.12fr]">
                    <SummaryItem icon={Bookmark} label="Booking ID" value={bookingNumber} />
                    <SummaryItem
                      icon={CalendarDays}
                      label="Booking Date"
                      value={bookingDate ? formatDateOnly(bookingDate) : '-'}
                      secondaryValue={bookingDate ? formatTimeOnly(bookingDate) : ''}
                    />
                    <SummaryItem icon={FileText} label="Payment Method" value={bill.payment_method || 'PayHere'} />
                    <SummaryItem icon={Bookmark} label="Payment Status" value={displayPaymentStatus} badge />
                    <div className="flex flex-col items-center justify-center bg-slate-950 px-5 py-5 text-center text-white sm:col-span-2 lg:col-span-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">Total Amount</p>
                      <p className="mt-1 text-2xl font-bold">{formatMoney(roomTotal, bill.currency)}</p>
                      <p className="mt-1 text-xs text-white/75">{paidInFull ? 'Paid in Full' : `${formatMoney(roomBalance, bill.currency)} Balance`}</p>
                    </div>
                  </div>
                </div>

                {bill.payment_status === 'Payment Pending' && isOnlinePaymentMethod(bill.payment_method) && (
                  <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                    Payment is still pending. Complete it within {formatCountdown(secondsRemaining)} to keep this room reserved.
                  </div>
                )}

                <div className="mt-6 hidden gap-5 md:grid md:grid-cols-[0.9fr_0.9fr_1.25fr]">
                  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                      <UserRound size={18} className="text-amber-700" />
                      <h2 className="font-serif text-xl text-slate-950">Guest Information</h2>
                    </div>
                    <div className="space-y-5">
                      <DetailBlock label="Guest Name" value={bill.full_name} />
                      <DetailBlock label="Email" value={bill.email} />
                      <DetailBlock label="Phone" value={bill.phone} />
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                      <CalendarDays size={18} className="text-amber-700" />
                      <h2 className="font-serif text-xl text-slate-950">Stay Information</h2>
                    </div>
                    <div className="space-y-5">
                      <DetailBlock label="Check-in" value={bill.check_in_date} />
                      <DetailBlock label="Check-out" value={bill.check_out_date} />
                      <DetailBlock label="Nights" value={`${nights} Night${nights === 1 ? '' : 's'}`} />
                      <DetailBlock label="Guests" value={`${bill.guests || 1} Guest${Number(bill.guests || 1) === 1 ? '' : 's'}`} />
                      {bookedRooms.length > 0
                        ? bookedRooms.map((room) => <DetailBlock key={room.booking_id} label={room.room_name} value={`${room.guests} Guest${Number(room.guests) === 1 ? '' : 's'}`} />)
                        : <DetailBlock label="Room Type" value={bill.room_name} />}
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4">
                      <FileText size={18} className="text-amber-700" />
                      <h2 className="font-serif text-xl text-slate-950">Price Breakdown</h2>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <span>Description</span><span>Amount ({bill.currency || 'USD'})</span>
                    </div>
                    {(bookedRooms.length > 0 ? bookedRooms : [{ booking_id: 'single', room_name: bill.room_name, amount: roomTotal }]).map((room) => (
                      <div key={room.booking_id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 py-5 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{room.room_name} ({nights} Night{nights === 1 ? '' : 's'})</p>
                          <p className="mt-1 text-xs text-slate-500">{stayDateRange(bill.check_in_date, bill.check_out_date)}{room.guests ? ` · ${room.guests} guests` : ''}</p>
                        </div>
                        <p className="font-semibold text-slate-950">{Number(room.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                    <div className="mt-5 flex items-center justify-between rounded-md border border-amber-100 bg-amber-50 px-4 py-4">
                      <span className="font-bold text-slate-900">TOTAL AMOUNT</span>
                      <span className="font-bold text-amber-800">{formatMoney(roomTotal, bill.currency)}</span>
                    </div>
                  </section>
                </div>

                <div className="mt-5 space-y-3 md:hidden">
                  <MobileAccordion icon={UserRound} title="Guest Information" sectionId="guest">
                    <div className="space-y-5">
                      <DetailBlock label="Guest Name" value={bill.full_name} />
                      <DetailBlock label="Email" value={bill.email} />
                      <DetailBlock label="Phone" value={bill.phone} />
                    </div>
                  </MobileAccordion>

                  <MobileAccordion icon={CalendarDays} title="Stay Information" sectionId="stay">
                    <div className="space-y-5">
                      <DetailBlock label="Check-in" value={bill.check_in_date} />
                      <DetailBlock label="Check-out" value={bill.check_out_date} />
                      <DetailBlock label="Nights" value={`${nights} Night${nights === 1 ? '' : 's'}`} />
                      <DetailBlock label="Guests" value={`${bill.guests || 1} Guest${Number(bill.guests || 1) === 1 ? '' : 's'}`} />
                      {bookedRooms.length > 0
                        ? bookedRooms.map((room) => <DetailBlock key={room.booking_id} label={room.room_name} value={`${room.guests} Guest${Number(room.guests) === 1 ? '' : 's'}`} />)
                        : <DetailBlock label="Room Type" value={bill.room_name} />}
                    </div>
                  </MobileAccordion>

                  <MobileAccordion icon={FileText} title="Price Breakdown" sectionId="price">
                    <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 pb-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <span>Description</span><span>Amount ({bill.currency || 'USD'})</span>
                    </div>
                    {(bookedRooms.length > 0 ? bookedRooms : [{ booking_id: 'single', room_name: bill.room_name, amount: roomTotal }]).map((room) => (
                      <div key={room.booking_id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 py-5 text-sm">
                        <div><p className="font-semibold text-slate-900">{room.room_name} ({nights} Night{nights === 1 ? '' : 's'})</p><p className="mt-1 text-xs text-slate-500">{stayDateRange(bill.check_in_date, bill.check_out_date)}{room.guests ? ` · ${room.guests} guests` : ''}</p></div>
                        <p className="font-semibold text-slate-950">{Number(room.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                    <div className="mt-5 flex items-center justify-between rounded-md border border-amber-100 bg-amber-50 px-4 py-4">
                      <span className="font-bold text-slate-900">TOTAL AMOUNT</span>
                      <span className="font-bold text-amber-800">{formatMoney(roomTotal, bill.currency)}</span>
                    </div>
                  </MobileAccordion>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                      <div>
                        <h2 className="font-serif text-lg font-semibold text-slate-950">Important Information</h2>
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                          <li>Check-in date: {bill.check_in_date || '-'}</li>
                          <li>Check-out date: {bill.check_out_date || '-'}</li>
                          <li>For assistance, contact {hotelPhoneLine}.</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Bookmark size={18} className="mt-0.5 shrink-0 text-amber-700" />
                      <div>
                        <h2 className="font-serif text-lg font-semibold text-slate-950">Thank You!</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">We appreciate your booking and look forward to hosting you.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row print:hidden">
                  {bill.can_retry_payment && (
                    <button type="button" onClick={handleRetryPayment} disabled={retryBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                      {retryBusy ? 'Starting Payment...' : bill.payment_status === 'Payment Pending' ? 'Resume Payment' : 'Retry Payment'}
                    </button>
                  )}
                  <button type="button" onClick={handleDownloadBill} disabled={pdfBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-7 py-3 text-sm font-bold text-slate-900 transition hover:border-amber-600 hover:text-amber-800 disabled:opacity-60">
                    <Download size={16} />{pdfBusy ? 'Preparing PDF...' : 'Download Bill (PDF)'}
                  </button>
                  <button type="button" onClick={handleShare} disabled={pdfBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-7 py-3 text-sm font-bold text-slate-900 transition hover:border-amber-600 hover:text-amber-800 disabled:opacity-60">
                    <Share2 size={16} />Share Bill
                  </button>
                </div>

                <div className="mt-10 border-t border-slate-200 py-7 print:hidden">
                  <div className="grid gap-5 text-sm text-slate-600 sm:grid-cols-3 justify-items-center items-center">
                    <div className="flex items-center gap-3"><Phone size={16} className="text-amber-700" /><span>{hotelPhoneLine}</span></div>
                    <div className="flex items-center gap-3"><Mail size={16} className="text-amber-700" /><span className="break-all">{hotelEmail}</span></div>
                    <div className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-amber-700" />{hotelMapsUrl ? <a href={hotelMapsUrl} target="_blank" rel="noreferrer" className="whitespace-pre-line hover:text-amber-800">{hotelAddress}</a> : <span className="whitespace-pre-line">{hotelAddress}</span>}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </FadeUp>
      </section>
    </PageTransition>
  )
}
