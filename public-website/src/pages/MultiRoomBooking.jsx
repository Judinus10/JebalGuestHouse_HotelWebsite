import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Images, Minus, Plus, Users, X } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import Button from '../components/ui/Button'
import { fetchRooms } from '../services/roomsApi'
import { API_BASE_URL } from '../services/config'
import roomsBanner from '../assets/images/banners/rooms-banner.webp'
import { bookingOutcomeUnknownMessage, publicErrorMessage, requestJson } from '../services/publicErrors'
import { useToast } from '../components/ui/ToastProvider'

const SUBMIT_URL = `${API_BASE_URL}/submit-multi-room-booking.php`
const ONLINE_PAYMENT_ENABLED = import.meta.env.VITE_ONLINE_PAYMENT_ENABLED === 'true'

function readFilters(params) {
  return {
    check_in_date: params.get('checkin') || params.get('check_in_date') || '',
    check_out_date: params.get('checkout') || params.get('check_out_date') || '',
    guests: Number(params.get('guests') || 0),
    room_type: params.get('room_type') || '',
  }
}

function assignRooms(availableRooms, totalGuests) {
  const sorted = [...availableRooms].sort((a, b) =>
    Number(b.max_guests || b.guests || 0) - Number(a.max_guests || a.guests || 0) || Number(a.id) - Number(b.id))
  const assigned = []
  let remaining = totalGuests
  for (const room of sorted) {
    if (remaining <= 0) break
    const capacity = Number(room.max_guests || room.guests || 0)
    if (capacity < 1) continue
    const allocatedGuests = Math.min(capacity, remaining)
    assigned.push({ ...room, allocatedGuests })
    remaining -= allocatedGuests
  }
  return remaining === 0 ? assigned : []
}

export default function MultiRoomBooking() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const [availableRooms, setAvailableRooms] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [bookingBlocked, setBookingBlocked] = useState(false)
  const [paymentToast, setPaymentToast] = useState('')
  const [gallery, setGallery] = useState(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const redirectingRef = useRef(false)
  const submittingRef = useRef(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '', payment_method: 'Cash' })

  useEffect(() => {
    let active = true
    async function loadRooms() {
      setLoading(true)
      setError('')
      try {
        const available = await fetchRooms({
          check_in_date: filters.check_in_date,
          check_out_date: filters.check_out_date,
          room_type: filters.room_type,
        })
        if (active) {
          setAvailableRooms(available)
          setRooms(assignRooms(available, filters.guests))
        }
      } catch (err) {
        if (active) setError(publicErrorMessage(err, 'rooms'))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadRooms()
    return () => { active = false }
  }, [filters])

  useEffect(() => {
    if (paymentToast) toast.warning(paymentToast)
  }, [paymentToast, toast])

  useEffect(() => {
    if (error) toast[bookingBlocked ? 'warning' : 'error'](error, bookingBlocked ? { duration: 0, title: 'Booking status needs attention' } : undefined)
  }, [bookingBlocked, error, toast])

  useEffect(() => {
    if (!loading && rooms.length === 0 && !error && filters.check_in_date && filters.check_out_date && filters.guests > 3) {
      toast.info('There are not enough matching rooms for this group. Change the dates, room type, or guest count and search again.', { title: 'No room combination available' })
    }
  }, [error, filters.check_in_date, filters.check_out_date, filters.guests, loading, rooms.length, toast])

  if (!filters.check_in_date || !filters.check_out_date || filters.guests <= 3) {
    return <Navigate to="/rooms" replace />
  }

  const allocatedTotal = rooms.reduce((sum, room) => sum + Number(room.allocatedGuests || 0), 0)
  const allocationValid = rooms.length >= 2 && allocatedTotal === filters.guests
    && rooms.every((room) => room.allocatedGuests >= 1 && room.allocatedGuests <= Number(room.max_guests || room.guests || 0))
  const nightlyTotal = rooms.reduce((sum, room) => sum + Number(room.price || room.base_price || 0), 0)

  const adjustGuests = (roomId, difference) => {
    setError('')
    setRooms((current) => current.map((room) => {
      if (room.id !== roomId) return room
      const capacity = Number(room.max_guests || room.guests || 0)
      return { ...room, allocatedGuests: Math.max(1, Math.min(capacity, room.allocatedGuests + difference)) }
    }))
  }

  const changeRoom = (slotIndex, roomId) => {
    setError('')
    const replacement = availableRooms.find((room) => String(room.id) === String(roomId))
    if (!replacement) return

    setRooms((current) => current.map((room, index) => {
      if (index !== slotIndex) return room
      const capacity = Number(replacement.max_guests || replacement.guests || 0)
      return {
        ...replacement,
        allocatedGuests: Math.max(1, Math.min(capacity, Number(room.allocatedGuests || 1))),
      }
    }))
  }

  const roomImages = (room) => {
    const images = Array.isArray(room.images) ? room.images.filter(Boolean) : []
    if (room.main_image && !images.includes(room.main_image)) images.unshift(room.main_image)
    return images
  }

  const openGallery = (room) => {
    const images = roomImages(room)
    if (!images.length) return
    setGallery({ name: room.name, images })
    setGalleryIndex(0)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handlePaymentChange = (event) => {
    if (event.target.value === 'PayHere' && !ONLINE_PAYMENT_ENABLED) {
      setPaymentToast('Online payment is not available right now. Please use Pay on Arrival or contact management for bank-transfer details.')
      setForm((current) => ({ ...current, payment_method: 'Cash' }))
      return
    }
    setForm((current) => ({ ...current, payment_method: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting || submittingRef.current || redirectingRef.current || bookingBlocked) return
    setError('')
    if (!allocationValid) {
      setError(`Allocate exactly ${filters.guests} guests across the assigned rooms.`)
      return
    }
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please complete your name, email address and phone number.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address, for example name@example.com.')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid contact number including the country code.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const result = await requestJson(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          check_in_date: filters.check_in_date,
          check_out_date: filters.check_out_date,
          total_guests: filters.guests,
          rooms: rooms.map((room) => ({ room_id: room.id, guests: room.allocatedGuests })),
        }),
      }, 'multiBooking')
      if (!result.bill_url) {
        setBookingBlocked(true)
        setError(bookingOutcomeUnknownMessage(true))
        return
      }
      redirectingRef.current = true
      const successUrl = new URL(result.bill_url, window.location.origin)
      successUrl.searchParams.set('booking_success', '1')
      const successBookingKey = successUrl.searchParams.get('booking_id') || successUrl.searchParams.get('order_id')
      if (successBookingKey) {
        window.sessionStorage.setItem(`jebal_booking_success:${successBookingKey}`, '1')
      }
      window.location.assign(successUrl.toString())
    } catch (err) {
      if (err?.outcomeUnknown) {
        setBookingBlocked(true)
        setError(bookingOutcomeUnknownMessage(false))
      } else {
        setError(publicErrorMessage(err, 'multiBooking'))
      }
    } finally {
      if (!redirectingRef.current) {
        submittingRef.current = false
        setSubmitting(false)
      }
    }
  }

  return (
    <PageTransition>
      <section className="relative flex h-[34vh] min-h-[260px] items-end bg-charcoal">
        <img src={roomsBanner} alt="Jebal Guest House rooms" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-10 text-white">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-light">Grouped Reservation</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Multi-Room Booking</h1>
        </div>
      </section>

      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp>
            <div className="mb-8 grid gap-4 border border-ice-dark bg-ice/30 p-5 text-sm sm:grid-cols-3">
              <p className="flex items-center gap-2"><CalendarDays size={17} className="text-gold" />{filters.check_in_date} to {filters.check_out_date}</p>
              <p className="flex items-center gap-2"><Users size={17} className="text-gold" />{filters.guests} guests</p>
              <p className="flex items-center gap-2"><BedDouble size={17} className="text-gold" />{rooms.length || '-'} assigned rooms</p>
            </div>
          </FadeUp>

          {loading && <p className="py-16 text-center text-muted">Assigning available rooms...</p>}
          {!loading && rooms.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted">There are not enough matching rooms for this group.</p>
              <Link to={`/rooms?${searchParams.toString()}`} className="mt-5 inline-block bg-charcoal px-6 py-3 text-xs tracking-[0.18em] uppercase text-white">Change Search</Link>
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div><h2 className="font-serif text-2xl text-charcoal">Choose Your Rooms</h2><p className="mt-1 text-sm text-muted">Change any assigned room and adjust the guest allocation if needed.</p></div>
                  <p className={`text-sm font-medium ${allocationValid ? 'text-emerald-700' : 'text-red-600'}`}>Allocated: {allocatedTotal} / {filters.guests} guests</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {rooms.map((room, slotIndex) => {
                    const images = roomImages(room)
                    const selectedElsewhere = new Set(rooms.filter((_, index) => index !== slotIndex).map((item) => String(item.id)))
                    return (
                    <div key={`room-slot-${slotIndex}`} className="overflow-hidden border border-ice-dark bg-white">
                      <button type="button" onClick={() => openGallery(room)} disabled={!images.length} className="group relative block h-48 w-full overflow-hidden bg-ice text-left disabled:cursor-default">
                        {images.length ? <img src={images[0]} alt={room.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-sm text-muted">No room image available</div>}
                        {images.length > 0 && <span className="absolute bottom-3 right-3 flex items-center gap-2 bg-charcoal/90 px-3 py-2 text-[11px] tracking-wider uppercase text-white"><Images size={14} />View {images.length > 1 ? `${images.length} photos` : 'photo'}</span>}
                      </button>
                      <div className="p-5">
                        <label className="block text-xs tracking-wider uppercase text-muted">
                          Room {slotIndex + 1}
                          <select value={room.id} onChange={(event) => changeRoom(slotIndex, event.target.value)} className="mt-2 w-full border border-ice-dark bg-white px-3 py-3 text-sm normal-case tracking-normal text-charcoal outline-none focus:border-gold">
                            {availableRooms.filter((option) => String(option.id) === String(room.id) || !selectedElsewhere.has(String(option.id))).map((option) => (
                              <option key={option.id} value={option.id}>{option.name} — {option.currency || 'USD'} {Number(option.price || option.base_price || 0).toFixed(2)} / night — max {option.max_guests || option.guests}</option>
                            ))}
                          </select>
                        </label>
                        <div className="mt-4 flex items-start justify-between gap-4">
                          <div><p className="font-serif text-xl text-charcoal">{room.name}</p><p className="mt-1 text-xs text-muted">Maximum {room.max_guests || room.guests} guests</p></div>
                          <p className="shrink-0 text-sm font-semibold">{room.currency || 'USD'} {Number(room.price || room.base_price || 0).toFixed(2)} / night</p>
                        </div>
                      <div className="mt-5 flex items-center justify-between border-t border-ice-dark pt-4">
                        <span className="text-xs tracking-wider uppercase text-muted">Guests in room</span>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => adjustGuests(room.id, -1)} className="grid h-9 w-9 place-items-center border border-charcoal/20"><Minus size={15} /></button>
                          <span className="w-6 text-center font-semibold">{room.allocatedGuests}</span>
                          <button type="button" onClick={() => adjustGuests(room.id, 1)} className="grid h-9 w-9 place-items-center border border-charcoal/20"><Plus size={15} /></button>
                        </div>
                      </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="border border-ice-dark p-6 md:p-8">
                  <h2 className="font-serif text-2xl">Booking Details</h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <label className="text-xs tracking-wider uppercase text-muted">Full Name<input required name="full_name" value={form.full_name} onChange={handleChange} className="mt-2 w-full border-b border-ice-dark py-2 text-sm text-charcoal outline-none focus:border-gold" /></label>
                    <label className="text-xs tracking-wider uppercase text-muted">Email<input required type="email" name="email" value={form.email} onChange={handleChange} className="mt-2 w-full border-b border-ice-dark py-2 text-sm text-charcoal outline-none focus:border-gold" /></label>
                    <label className="text-xs tracking-wider uppercase text-muted">Phone<input required name="phone" value={form.phone} onChange={handleChange} className="mt-2 w-full border-b border-ice-dark py-2 text-sm text-charcoal outline-none focus:border-gold" /></label>
                    <label className="text-xs tracking-wider uppercase text-muted sm:col-span-2">Message<textarea name="message" rows={3} value={form.message} onChange={handleChange} className="mt-2 w-full resize-none border-b border-ice-dark py-2 text-sm text-charcoal outline-none focus:border-gold" /></label>
                  </div>
                </div>
                <div className="border border-ice-dark bg-ice/20 p-6 md:p-8">
                  <h2 className="font-serif text-2xl">Payment</h2>
                  <div className="mt-5 space-y-3 text-sm">
                    <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="payment_method" value="Cash" checked={form.payment_method === 'Cash'} onChange={handlePaymentChange} />Pay on Arrival</label>
                    <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="payment_method" value="PayHere" checked={form.payment_method === 'PayHere'} onChange={handlePaymentChange} />Pay Online</label>
                  </div>
                  <div className="mt-7 border-t border-ice-dark pt-5"><div className="flex justify-between text-sm"><span>Rooms per night</span><span>USD {nightlyTotal.toFixed(2)}</span></div><p className="mt-2 text-xs text-muted">The final total includes the complete stay.</p></div>
                  <Button type="submit" disabled={submitting || !allocationValid || bookingBlocked} className="mt-7 w-full">{bookingBlocked ? 'Contact Property' : submitting ? 'Booking...' : 'Book Assigned Rooms'}</Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
      {gallery && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-charcoal/95 p-4" role="dialog" aria-modal="true" aria-label={`${gallery.name} photos`}>
          <button type="button" onClick={() => setGallery(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center border border-white/40 text-white" aria-label="Close photos"><X /></button>
          {gallery.images.length > 1 && <button type="button" onClick={() => setGalleryIndex((galleryIndex - 1 + gallery.images.length) % gallery.images.length)} className="absolute left-3 z-10 grid h-11 w-11 place-items-center bg-white/90 text-charcoal md:left-8" aria-label="Previous photo"><ChevronLeft /></button>}
          <div className="w-full max-w-5xl text-center">
            <img src={gallery.images[galleryIndex]} alt={`${gallery.name} ${galleryIndex + 1}`} className="mx-auto max-h-[75vh] w-auto max-w-full object-contain" />
            <p className="mt-4 text-sm text-white">{gallery.name} · {galleryIndex + 1} / {gallery.images.length}</p>
          </div>
          {gallery.images.length > 1 && <button type="button" onClick={() => setGalleryIndex((galleryIndex + 1) % gallery.images.length)} className="absolute right-3 z-10 grid h-11 w-11 place-items-center bg-white/90 text-charcoal md:right-8" aria-label="Next photo"><ChevronRight /></button>}
        </div>
      )}
    </PageTransition>
  )
}
