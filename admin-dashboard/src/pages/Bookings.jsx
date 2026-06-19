import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  Filter,
  Hotel,
  Mail,
  MoreVertical,
  Moon,
  Phone,
  Search,
  Trash2,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { bookingRooms, bookingStatuses, initialBookings, paymentStatuses } from '@/data/bookingData'
import { deleteBooking, fetchBookings, updateBookingStatus } from '@/services/bookingsApi'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const bookingStatusVariant = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'destructive',

}

const paymentStatusVariant = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  refunded: 'secondary',
}

function formatDate(date) {
  if (!date) return '-'
  return dateFormatter.format(new Date(date))
}

function formatMoney(amount) {
  return currencyFormatter.format(Number(amount || 0))
}

function humanizeStatus(value) {
  if (!value) return '-'
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getRoom(roomId, roomName = '') {
  return bookingRooms.find((room) => room.id === Number(roomId)) || bookingRooms.find((room) => room.room_name === roomName)
}

function Modal({ title, description, children, onClose, size = 'max-w-3xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full ${size} overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

function Toast({ toast, onClose }) {
  if (!toast) return null

  const Icon = toast.type === 'error' ? XCircle : CheckCircle2
  const tone = toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className={`fixed right-5 top-5 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${tone}`}>
      <Icon className="h-5 w-5" />
      <p className="text-sm font-semibold">{toast.message}</p>
      <button type="button" onClick={onClose} className="ml-2 rounded p-1 hover:bg-white/60">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
          {description ? <p className="mt-1 text-xs font-medium text-text-secondary">{description}</p> : null}
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  )
}

function ActionsDropdown({ booking, onView, onEditStatus, onCancel }) {
  const [open, setOpen] = useState(false)

  const handleAction = (callback) => {
    callback()
    setOpen(false)
  }

  return (
    <div className="relative flex justify-end">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
        <MoreVertical className="h-4 w-4" />
        Actions
      </Button>

      {open ? (
        <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
          <button
            type="button"
            onClick={() => handleAction(onView)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-blue-700" />
            View Details
          </button>
          <button
            type="button"
            onClick={() => handleAction(onEditStatus)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text-primary transition hover:bg-slate-50"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Edit Status
          </button>
          <button
            type="button"
            disabled={booking.booking_status === 'cancelled'}
            onClick={() => handleAction(onCancel)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Booking
          </button>
        </div>
      ) : null}
    </div>
  )
}

function StatusSelectModal({ booking, onClose, onSave }) {
  const [bookingStatus, setBookingStatus] = useState(booking.booking_status)

  const isCancelling = booking.booking_status !== 'cancelled' && bookingStatus === 'cancelled'

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isCancelling) {
      const confirmed = window.confirm('Cancel this booking? This action updates the booking status to cancelled.')
      if (!confirmed) return
    }

    onSave(booking.id, bookingStatus)
  }

  return (
    <Modal title="Update booking status" description={`Manage ${booking.booking_no}`} onClose={onClose} size="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-slate-50 p-4">
          <p className="text-sm font-semibold text-text-primary">{booking.guest_name}</p>
          <p className="mt-1 text-sm text-text-secondary">{getRoom(booking.room_id, booking.room_name)?.room_name || booking.room_name}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Booking status</Label>
            <select
              value={bookingStatus}
              onChange={(event) => setBookingStatus(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Current status</Label>
            <div className="flex h-10 items-center rounded-lg border border-border bg-slate-50 px-3 text-sm font-semibold text-text-primary">
              {humanizeStatus(booking.booking_status)}
            </div>
          </div>
        </div>

        {isCancelling ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            You selected cancelled. A confirmation will be required before saving.
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}

function BookingDetailsModal({ booking, onClose }) {
  const room = getRoom(booking.room_id, booking.room_name)

  return (
    <Modal title="Booking details" description={booking.booking_no} onClose={onClose}>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-secondary">Guest information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-blue-700" />
                <span className="font-semibold text-text-primary">{booking.guest_name}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail className="h-4 w-4 text-blue-700" />
                <span>{booking.guest_email}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone className="h-4 w-4 text-blue-700" />
                <span>{booking.guest_phone}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-secondary">Stay information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">Check-in</p>
                <p className="mt-1 font-semibold text-text-primary">{formatDate(booking.check_in)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">Check-out</p>
                <p className="mt-1 font-semibold text-text-primary">{formatDate(booking.check_out)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">Guests</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {booking.adults} adults · {booking.children} children
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-text-secondary">Total nights</p>
                <p className="mt-1 font-semibold text-text-primary">{booking.total_nights}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-secondary">Special request</h3>
            <p className="text-sm leading-6 text-text-secondary">{booking.special_request || 'No special request added.'}</p>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Hotel className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{room?.room_name || 'Unknown room'}</p>
                <p className="text-sm text-text-secondary">{room?.room_type} · Capacity {room?.capacity}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between border-t border-border pt-4">
                <span className="text-text-secondary">Price per night</span>
                <span className="font-semibold text-text-primary">{formatMoney(room?.price_per_night)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total amount</span>
                <span className="text-lg font-bold text-text-primary">{formatMoney(booking.total_amount)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-secondary">Current status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={bookingStatusVariant[booking.booking_status]}>{humanizeStatus(booking.booking_status)}</Badge>
              <Badge variant={paymentStatusVariant[booking.payment_status]}>{humanizeStatus(booking.payment_status)}</Badge>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-secondary">Timeline</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <p>Created: {formatDate(booking.created_at)}</p>
              <p>Updated: {formatDate(booking.updated_at)}</p>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}

function CancelBookingModal({ booking, onClose, onConfirm }) {
  return (
    <Modal title="Delete booking" description="This will permanently remove this booking inquiry from the admin list." onClose={onClose} size="max-w-lg">
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Are you sure you want to delete <span className="font-bold">{booking.booking_no}</span> for{' '}
          <span className="font-bold">{booking.guest_name}</span>?
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Keep Inquiry
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(booking.id)}>
            Delete Booking
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Bookings() {
  const [bookings, setBookings] = useState(initialBookings)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [statusBooking, setStatusBooking] = useState(null)
  const [cancelBooking, setCancelBooking] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  const loadBookings = async () => {
    try {
      setIsLoading(true)
      const data = await fetchBookings()
      setBookings(data)
    } catch (error) {
      showToast(error.message || 'Unable to load bookings.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return bookings.filter((booking) => {
      const room = getRoom(booking.room_id, booking.room_name)
      const searchableText = [
        booking.booking_no,
        booking.guest_name,
        booking.guest_phone,
        booking.guest_email,
        room?.room_name || booking.room_name,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !query || searchableText.includes(query)
      const matchesBookingStatus = bookingStatusFilter === 'all' || booking.booking_status === bookingStatusFilter
      const matchesPaymentStatus = paymentStatusFilter === 'all' || booking.payment_status === paymentStatusFilter
      const matchesDateFrom = !dateFrom || booking.check_in >= dateFrom
      const matchesDateTo = !dateTo || booking.check_in <= dateTo

      return matchesSearch && matchesBookingStatus && matchesPaymentStatus && matchesDateFrom && matchesDateTo
    })
  }, [bookings, searchTerm, bookingStatusFilter, paymentStatusFilter, dateFrom, dateTo])

  const summary = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc.total += 1
        acc[booking.booking_status] = (acc[booking.booking_status] || 0) + 1
        if (booking.booking_status === 'confirmed') {
          acc.revenue += Number(booking.total_amount || 0)
        }
        return acc
      },
      { total: 0, pending: 0, confirmed: 0, cancelled: 0, revenue: 0 }
    )
  }, [bookings])

  const clearFilters = () => {
    setSearchTerm('')
    setBookingStatusFilter('all')
    setPaymentStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handleStatusSave = async (bookingId, bookingStatus) => {
    try {
      const updatedBooking = await updateBookingStatus(bookingId, bookingStatus)

      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                ...updatedBooking,
              }
            : booking
        )
      )

      setStatusBooking(null)
      showToast('Booking status updated successfully.')
    } catch (error) {
      showToast(error.message || 'Unable to update booking status.', 'error')
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      await deleteBooking(bookingId)
      setBookings((current) => current.filter((booking) => booking.id !== bookingId))
      setCancelBooking(null)
      showToast('Booking inquiry deleted successfully.')
    } catch (error) {
      showToast(error.message || 'Unable to delete booking inquiry.', 'error')
    }
  }

  return (
    <div className="space-y-6 overflow-visible">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader title="Bookings" description="View, filter, and manage Jebal Homes booking inquiries.">
        <Button variant="outline" onClick={clearFilters}>
          <Filter className="h-4 w-4" />
          Clear Filters
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total bookings" value={summary.total} icon={CalendarDays} description="All reservations" />
        <SummaryCard title="Pending" value={summary.pending} icon={Moon} description="Need attention" />
        <SummaryCard title="Confirmed" value={summary.confirmed} icon={CheckCircle2} description="Upcoming stays" />
        <SummaryCard title="Cancelled" value={summary.cancelled} icon={XCircle} description="Cancelled reservations" />
        <SummaryCard title="Total revenue" value={formatMoney(summary.revenue)} icon={CreditCard} description="Confirmed inquiry value" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search booking, guest, email, phone..."
                className="pl-9"
              />
            </div>

            <select
              value={bookingStatusFilter}
              onChange={(event) => setBookingStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All booking statuses</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All payment statuses</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </select>

            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden border-b border-border bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-text-secondary xl:grid xl:grid-cols-[1.15fr_1.1fr_1.35fr_1.4fr_0.85fr_1fr_1fr_0.9fr] xl:items-center xl:gap-4">
            <span>Booking No</span>
            <span>Guest</span>
            <span>Room</span>
            <span>Stay Dates</span>
            <span>Amount</span>
            <span>Booking Status</span>
            <span>Payment Status</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                <CalendarDays className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-text-primary">Loading bookings</h3>
              <p className="mt-2 max-w-md text-sm text-text-secondary">Fetching booking inquiries from the server.</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                <CalendarDays className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-text-primary">No bookings found</h3>
              <p className="mt-2 max-w-md text-sm text-text-secondary">
                No booking matches your current search or filter settings. Clear filters and try again.
              </p>
              <Button className="mt-5" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredBookings.map((booking) => {
                const room = getRoom(booking.room_id, booking.room_name)

                return (
                  <div
                    key={booking.id}
                    className="grid gap-4 px-5 py-4 transition hover:bg-blue-50/40 xl:grid-cols-[1.15fr_1.1fr_1.35fr_1.4fr_0.85fr_1fr_1fr_0.9fr] xl:items-center"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Booking No</p>
                      <p className="font-bold text-text-primary">{booking.booking_no}</p>
                      <p className="mt-1 text-xs text-text-secondary">Created {formatDate(booking.created_at)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Guest</p>
                      <p className="font-semibold text-text-primary">{booking.guest_name}</p>
                      <p className="mt-1 text-xs text-text-secondary">{booking.guest_phone}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Room</p>
                      <p className="font-semibold text-text-primary">{room?.room_name || booking.room_name || 'Unknown room'}</p>
                      <p className="mt-1 text-xs text-text-secondary">{room?.room_type || booking.room_type || '-'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Stay Dates</p>
                      <p className="font-semibold text-text-primary">
                        {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">{booking.total_nights} night{booking.total_nights === 1 ? '' : 's'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Amount</p>
                      <p className="font-bold text-text-primary">{formatMoney(booking.total_amount)}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Booking Status</p>
                      <Badge variant={bookingStatusVariant[booking.booking_status]}>{humanizeStatus(booking.booking_status)}</Badge>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-text-secondary xl:hidden">Payment Status</p>
                      <Badge variant={paymentStatusVariant[booking.payment_status]}>{humanizeStatus(booking.payment_status)}</Badge>
                    </div>

                    <ActionsDropdown
                      booking={booking}
                      onView={() => setSelectedBooking(booking)}
                      onEditStatus={() => setStatusBooking(booking)}
                      onCancel={() => setCancelBooking(booking)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking ? <BookingDetailsModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} /> : null}
      {statusBooking ? (
        <StatusSelectModal booking={statusBooking} onClose={() => setStatusBooking(null)} onSave={handleStatusSave} />
      ) : null}
      {cancelBooking ? (
        <CancelBookingModal
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={handleCancelBooking}
        />
      ) : null}
    </div>
  )
}
