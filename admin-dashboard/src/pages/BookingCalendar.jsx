import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PageHeader, SectionCard } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarBookings = [
  {
    id: 1,
    booking_no: 'BK-1042',
    guest_name: 'Sarah Williams',
    guest_phone: '+94 77 112 2334',
    room_name: 'Ground Floor Room 1',
    room_code: 'G01',
    property_type: 'Ground Floor',
    check_in: '2026-06-15',
    check_out: '2026-06-18',
    total_nights: 3,
    adults: 2,
    children: 0,
    booking_status: 'confirmed',
    payment_status: 'paid',
    total_amount: 180,
    special_request: 'Guest requested quiet room and early check-in if possible.',
  },
  {
    id: 2,
    booking_no: 'BK-1043',
    guest_name: 'Kavindu Perera',
    guest_phone: '+94 76 445 9912',
    room_name: 'Private Cottage',
    room_code: 'Cottage',
    property_type: 'Cottage',
    check_in: '2026-06-17',
    check_out: '2026-06-21',
    total_nights: 4,
    adults: 2,
    children: 1,
    booking_status: 'pending',
    payment_status: 'pending',
    total_amount: 360,
    special_request: 'Needs confirmation after advance payment.',
  },
  {
    id: 3,
    booking_no: 'BK-1044',
    guest_name: 'Meera Nadarajah',
    guest_phone: '+94 75 123 8877',
    room_name: 'First Floor Room 1',
    room_code: 'F01',
    property_type: 'First Floor',
    check_in: '2026-06-18',
    check_out: '2026-06-22',
    total_nights: 4,
    adults: 3,
    children: 1,
    booking_status: 'checked_in',
    payment_status: 'paid',
    total_amount: 280,
    special_request: '',
  },
  {
    id: 4,
    booking_no: 'BK-1045',
    guest_name: 'Ramesh Kumar',
    guest_phone: '+94 71 778 2110',
    room_name: 'Family Room',
    room_code: 'Family',
    property_type: 'First Floor',
    check_in: '2026-06-23',
    check_out: '2026-06-27',
    total_nights: 4,
    adults: 4,
    children: 2,
    booking_status: 'confirmed',
    payment_status: 'paid',
    total_amount: 420,
    special_request: 'Extra pillows requested.',
  },
  {
    id: 5,
    booking_no: 'BK-1046',
    guest_name: 'Nimali Fernando',
    guest_phone: '+94 77 400 1199',
    room_name: 'Ground Floor Room 2',
    room_code: 'G02',
    property_type: 'Ground Floor',
    check_in: '2026-06-24',
    check_out: '2026-06-25',
    total_nights: 1,
    adults: 1,
    children: 0,
    booking_status: 'cancelled',
    payment_status: 'refunded',
    total_amount: 60,
    special_request: 'Cancelled by guest.',
  },
  {
    id: 6,
    booking_no: 'BK-1047',
    guest_name: 'David Lee',
    guest_phone: '+44 7400 112233',
    room_name: 'First Floor Room 2',
    room_code: 'F02',
    property_type: 'First Floor',
    check_in: '2026-06-28',
    check_out: '2026-06-30',
    total_nights: 2,
    adults: 2,
    children: 0,
    booking_status: 'no_show',
    payment_status: 'failed',
    total_amount: 150,
    special_request: '',
  },
]

const statusStyles = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200',
  checked_in: 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200',
  checked_out: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
  cancelled: 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200',
  no_show: 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200',
}

const statusVariant = {
  pending: 'warning',
  confirmed: 'success',
  checked_in: 'default',
  checked_out: 'secondary',
  cancelled: 'destructive',
  no_show: 'default',
  paid: 'success',
  refunded: 'secondary',
  failed: 'destructive',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function normalizeStatus(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toDate(value) {
  return new Date(`${value}T00:00:00`)
}

function formatDate(value) {
  return dateFormatter.format(toDate(value))
}

function getMonthWeeks(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const lastDay = new Date(year, monthIndex + 1, 0)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  const end = new Date(lastDay)
  end.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const weeks = []
  let cursor = new Date(start)

  while (cursor <= end) {
    const week = []
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

function getSegmentForWeek(booking, week) {
  const checkIn = toDate(booking.check_in)
  const checkOut = toDate(booking.check_out)
  const weekStart = week[0]
  const weekEnd = week[6]

  if (checkOut < weekStart || checkIn > weekEnd) return null

  const visibleStart = checkIn > weekStart ? checkIn : weekStart
  const visibleEnd = checkOut < weekEnd ? checkOut : weekEnd
  const startIndex = visibleStart.getDay()
  const endIndex = visibleEnd.getDay()

  return {
    booking,
    startIndex,
    endIndex,
    span: endIndex - startIndex + 1,
    startsHere: checkIn >= weekStart && checkIn <= weekEnd,
    endsHere: checkOut >= weekStart && checkOut <= weekEnd,
  }
}

function buildWeekSegments(bookings, week) {
  const segments = bookings
    .map((booking) => getSegmentForWeek(booking, week))
    .filter(Boolean)
    .sort((a, b) => a.startIndex - b.startIndex || b.span - a.span)

  const lanes = []

  return segments.map((segment) => {
    let laneIndex = lanes.findIndex((laneEnd) => segment.startIndex > laneEnd)
    if (laneIndex === -1) {
      laneIndex = lanes.length
      lanes.push(segment.endIndex)
    } else {
      lanes[laneIndex] = segment.endIndex
    }

    return { ...segment, laneIndex }
  })
}

function getTooltipPosition(rect) {
  const tooltipWidth = 340
  const tooltipHeight = 430
  const gap = 10
  const padding = 12

  let left = rect.left + rect.width / 2 - tooltipWidth / 2
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))

  let top = rect.bottom + gap
  if (top + tooltipHeight > window.innerHeight - padding) {
    top = rect.top - tooltipHeight - gap
  }
  if (top < padding) {
    top = padding
  }

  return { left, top, width: tooltipWidth }
}

function FloatingBookingTooltip({ tooltip }) {
  if (!tooltip) return null

  const { booking, position } = tooltip

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] rounded-xl border border-slate-200 bg-white p-4 text-left text-xs text-slate-700 shadow-2xl"
      style={{ left: position.left, top: position.top, width: position.width }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{booking.booking_no}</p>
          <p className="text-xs text-slate-500">{booking.room_name}</p>
        </div>
        <Badge variant={statusVariant[booking.booking_status] || 'secondary'}>
          {normalizeStatus(booking.booking_status)}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="font-semibold text-slate-500">Guest</dt><dd>{booking.guest_name}</dd>
        <dt className="font-semibold text-slate-500">Contact</dt><dd>{booking.guest_phone}</dd>
        <dt className="font-semibold text-slate-500">Room</dt><dd>{booking.room_code}</dd>
        <dt className="font-semibold text-slate-500">Property</dt><dd>{booking.property_type}</dd>
        <dt className="font-semibold text-slate-500">Check-in</dt><dd>{formatDate(booking.check_in)}</dd>
        <dt className="font-semibold text-slate-500">Check-out</dt><dd>{formatDate(booking.check_out)}</dd>
        <dt className="font-semibold text-slate-500">Nights</dt><dd>{booking.total_nights}</dd>
        <dt className="font-semibold text-slate-500">Adults</dt><dd>{booking.adults}</dd>
        <dt className="font-semibold text-slate-500">Children</dt><dd>{booking.children}</dd>
        <dt className="font-semibold text-slate-500">Payment</dt><dd>{normalizeStatus(booking.payment_status)}</dd>
        <dt className="font-semibold text-slate-500">Amount</dt><dd>{currencyFormatter.format(booking.total_amount)}</dd>
      </dl>
      {booking.special_request && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <p className="font-semibold text-slate-500">Special request</p>
          <p className="mt-1 text-slate-700">{booking.special_request}</p>
        </div>
      )}
    </div>,
    document.body
  )
}

function BookingDetailsModal({ booking, onClose }) {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Booking Details</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{booking.booking_no}</h2>
            <p className="text-sm text-slate-500">{booking.guest_name} · {booking.room_name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-950">Guest & Stay</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-500">Guest:</span> {booking.guest_name}</p>
              <p><span className="font-semibold text-slate-500">Phone:</span> {booking.guest_phone}</p>
              <p><span className="font-semibold text-slate-500">Adults:</span> {booking.adults}</p>
              <p><span className="font-semibold text-slate-500">Children:</span> {booking.children}</p>
              <p><span className="font-semibold text-slate-500">Check-in:</span> {formatDate(booking.check_in)}</p>
              <p><span className="font-semibold text-slate-500">Check-out:</span> {formatDate(booking.check_out)}</p>
              <p><span className="font-semibold text-slate-500">Total nights:</span> {booking.total_nights}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-950">Room & Payment</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-500">Room:</span> {booking.room_name}</p>
              <p><span className="font-semibold text-slate-500">Room code:</span> {booking.room_code}</p>
              <p><span className="font-semibold text-slate-500">Property type:</span> {booking.property_type}</p>
              <p><span className="font-semibold text-slate-500">Amount:</span> {currencyFormatter.format(booking.total_amount)}</p>
              <p><span className="font-semibold text-slate-500">Booking status:</span> <Badge variant={statusVariant[booking.booking_status] || 'secondary'}>{normalizeStatus(booking.booking_status)}</Badge></p>
              <p><span className="font-semibold text-slate-500">Payment status:</span> <Badge variant={statusVariant[booking.payment_status] || 'secondary'}>{normalizeStatus(booking.payment_status)}</Badge></p>
            </div>
          </div>

          {booking.special_request && (
            <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-950">Special Request</h3>
              <p className="mt-2 text-sm text-slate-700">{booking.special_request}</p>
            </div>
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 md:col-span-2">
            <h3 className="text-sm font-bold text-blue-950">Quick Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline">View details</Button>
              <Button size="sm" variant="outline">Confirm booking</Button>
              <Button size="sm" variant="outline">Cancel booking</Button>
              <Button size="sm" variant="outline">Mark checked in</Button>
              <Button size="sm" variant="outline">Mark checked out</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1))
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const year = currentDate.getFullYear()
  const monthIndex = currentDate.getMonth()
  const weeks = useMemo(() => getMonthWeeks(year, monthIndex), [year, monthIndex])
  const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)

  const goToPreviousMonth = () => setCurrentDate(new Date(year, monthIndex - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, monthIndex + 1, 1))
  const goToToday = () => setCurrentDate(new Date(2026, 5, 1))

  const showTooltip = (event, booking) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({ booking, position: getTooltipPosition(rect) })
  }

  const hideTooltip = () => setTooltip(null)

  return (
    <div>
      <PageHeader
        title="Booking Calendar"
        description="Visual occupancy calendar showing reservation date ranges across rooms."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center text-sm font-semibold text-slate-800">{monthTitle}</span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>Today</Button>
        </div>
      </PageHeader>

      <SectionCard className="overflow-hidden p-0">
        <div className="hidden border-b border-slate-200 bg-slate-50 md:grid md:grid-cols-7">
          {days.map((day) => (
            <div key={day} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              {day}
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          {weeks.map((week, weekIndex) => {
            const segments = buildWeekSegments(calendarBookings, week)
            const maxLane = segments.reduce((max, segment) => Math.max(max, segment.laneIndex), 0)
            const rowHeight = Math.max(132, 74 + (maxLane + 1) * 32)

            return (
              <div key={weekIndex} className="relative border-b border-slate-200 last:border-b-0" style={{ minHeight: rowHeight }}>
                <div className="absolute inset-0 grid grid-cols-7">
                  {week.map((date) => {
                    const isCurrentMonth = date.getMonth() === monthIndex
                    const isToday = date.toISOString().slice(0, 10) === '2026-06-15'

                    return (
                      <div key={date.toISOString()} className="border-r border-slate-200 p-3 last:border-r-0">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>
                          {date.getDate()}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="absolute inset-x-0 top-12">
                  {segments.map((segment) => {
                    const booking = segment.booking
                    const roundedClass = [
                      segment.startsHere ? 'rounded-l-full' : 'rounded-l-none',
                      segment.endsHere ? 'rounded-r-full' : 'rounded-r-none',
                    ].join(' ')

                    return (
                      <button
                        key={`${booking.id}-${weekIndex}`}
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        onMouseEnter={(event) => showTooltip(event, booking)}
                        onMouseMove={(event) => showTooltip(event, booking)}
                        onMouseLeave={hideTooltip}
                        onFocus={(event) => showTooltip(event, booking)}
                        onBlur={hideTooltip}
                        className={`absolute flex h-7 items-center border px-3 text-left text-xs font-bold shadow-sm transition ${roundedClass} ${statusStyles[booking.booking_status] || statusStyles.pending}`}
                        style={{
                          left: `${(segment.startIndex / 7) * 100}%`,
                          width: `${(segment.span / 7) * 100}%`,
                          top: `${segment.laneIndex * 31}px`,
                        }}
                      >
                        <span className="truncate">{booking.guest_name} · {booking.room_code}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 p-4 md:hidden">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            Mobile agenda view · {monthTitle}
          </div>
          {calendarBookings.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => setSelectedBooking(booking)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{booking.guest_name} · {booking.room_code}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(booking.check_in)} – {formatDate(booking.check_out)}</p>
                </div>
                <Badge variant={statusVariant[booking.booking_status] || 'secondary'}>{normalizeStatus(booking.booking_status)}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-600">{booking.room_name} · {currencyFormatter.format(booking.total_amount)}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <FloatingBookingTooltip tooltip={tooltip} />

      {selectedBooking && (
        <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  )
}
