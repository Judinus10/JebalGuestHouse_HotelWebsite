import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom'
import { Users, Maximize2, BedDouble, Check, ArrowLeft, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import ImageReveal from '../components/ui/ImageReveal'
import Button from '../components/ui/Button'
import RoomCard from '../components/ui/RoomCard'
import { checkRoomAvailability, fetchRoom, fetchRooms } from '../services/roomsApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const BOOKING_API_URL = `${API_BASE_URL}/submit-booking.php`
const PAYMENT_INIT_API_URL = `${API_BASE_URL}/payments/create-checkout-session.php`

/**
 * Individual room details page with gallery, amenities, and booking CTA.
 * UI and animation classes are intentionally kept from the finalized version.
 */
export default function RoomDetails() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [room, setRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    is_booking_for_other: false,
    staying_guest_name: '',
    staying_guest_email: '',
    staying_guest_phone: '',
    staying_guest_note: '',
    check_in_date: '',
    check_out_date: '',
    guests: '2',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availabilityWarning, setAvailabilityWarning] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function loadData() {
      setPageLoading(true)
      setNotFound(false)
      setActiveImage(0)

      try {
        const [roomData, roomList] = await Promise.all([
          fetchRoom(id),
          fetchRooms(),
        ])

        if (!active) return
        setRoom(roomData)
        setRooms(roomList)
      } catch (err) {
        if (active) setNotFound(true)
      } finally {
        if (active) setPageLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    const checkInDate = searchParams.get('check_in_date') || ''
    const checkOutDate = searchParams.get('check_out_date') || ''
    const guests = searchParams.get('guests') || ''

    if (!checkInDate && !checkOutDate && !guests) return

    setFormData((current) => ({
      ...current,
      check_in_date: checkInDate || current.check_in_date,
      check_out_date: checkOutDate || current.check_out_date,
      guests: guests || current.guests,
    }))
  }, [searchParams])

  useEffect(() => {
    let active = true

    async function verifySelectedDates() {
      setAvailabilityWarning('')

      if (!room || !formData.check_in_date || !formData.check_out_date) return

      if (formData.check_out_date <= formData.check_in_date) {
        setAvailabilityWarning('Check-out date must be after check-in date. Minimum stay is 1 night.')
        return
      }

      try {
        setCheckingAvailability(true)
        const result = await checkRoomAvailability({
          roomId: room.id,
          roomName: room.name,
          checkInDate: formData.check_in_date,
          checkOutDate: formData.check_out_date,
        })

        if (!active) return

        if (!result.available) {
          setAvailabilityWarning('This room is not available for the selected dates.')
        }
      } catch (err) {
        if (active) setAvailabilityWarning('Unable to confirm availability right now. Please try again.')
      } finally {
        if (active) setCheckingAvailability(false)
      }
    }

    verifySelectedDates()

    return () => {
      active = false
    }
  }, [room, formData.check_in_date, formData.check_out_date])

  const relatedRooms = useMemo(() => {
    if (!room) return []
    return rooms.filter((r) => Number(r.id) !== Number(room.id)).slice(0, 3)
  }, [room, rooms])

  if (pageLoading) {
    return (
      <PageTransition>
        <section className="flex min-h-[50vh] items-center justify-center bg-white">
          <p className="text-sm text-muted">Loading room...</p>
        </section>
      </PageTransition>
    )
  }

  if (notFound || !room) return <Navigate to="/rooms" replace />

  const images = room.images?.length ? room.images : [room.main_image].filter(Boolean)
  const isRoomUnavailable = Boolean(availabilityWarning)
  const paymentState = (searchParams.get('payment') || '').toLowerCase()
  const paymentMessage = paymentState === 'failed' || paymentState === 'cancelled'
    ? 'Payment was not completed. You can try booking again or contact the hotel for help.'
    : ''

  const showPreviousImage = () => {
    if (!images.length) return
    setActiveImage((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  const showNextImage = () => {
    if (!images.length) return
    setActiveImage((current) => (current === images.length - 1 ? 0 : current + 1))
  }

  const openImageViewer = (index) => {
    setActiveImage(index)
    setLightboxOpen(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setAvailabilityWarning('')

    try {
      if (formData.check_out_date <= formData.check_in_date) {
        setAvailabilityWarning('Check-out date must be after check-in date. Minimum stay is 1 night.')
        setLoading(false)
        return
      }

      const availability = await checkRoomAvailability({
        roomId: room.id,
        roomName: room.name,
        checkInDate: formData.check_in_date,
        checkOutDate: formData.check_out_date,
      })

      if (!availability.available) {
        setAvailabilityWarning('This room is not available for the selected dates.')
        setLoading(false)
        return
      }

      const response = await fetch(BOOKING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          room_name: room.name,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to send booking inquiry.')
      }

      const paymentResponse = await fetch(PAYMENT_INIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking_id: result.inquiry_id }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok || !paymentResult.success) {
        throw new Error(paymentResult.message || 'Booking saved, but payment could not be started.')
      }

      if (paymentResult.checkout_url) {
        window.location.href = paymentResult.checkout_url
        return
      }

      setSubmitted(true)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        is_booking_for_other: false,
        staying_guest_name: '',
        staying_guest_email: '',
        staying_guest_phone: '',
        staying_guest_note: '',
        check_in_date: '',
        check_out_date: '',
        guests: '2',
        message: '',
      })
    } catch (err) {
      setError(err.message || 'Unable to send booking inquiry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      {/* Hero image */}
      <section className="relative h-[50vh] min-h-[350px]">
        <img
          src={images[activeImage]}
          alt={room.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full px-6 pb-10">
          <div className="mx-auto max-w-7xl">
            <FadeUp>
              <Link
                to="/rooms"
                className="mb-4 inline-flex items-center gap-2 text-xs tracking-wider uppercase text-white/80 hover:text-white"
              >
                <ArrowLeft size={14} />
                Back to Rooms
              </Link>
              <p className="text-xs tracking-[0.2em] uppercase text-gold-light">
                {room.type}
              </p>
              <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
                {room.name}
              </h1>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Room details */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
            {/* Main content */}
            <div className="lg:col-span-2">
              <FadeUp>
                <p className="text-sm leading-relaxed text-muted md:text-base">
                  {room.longDescription || room.description}
                </p>
              </FadeUp>

              {/* Image gallery thumbnails */}
              <FadeUp delay={0.1}>
                <div className="mt-10 grid grid-cols-3 gap-4">
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => openImageViewer(i)}
                      className={`image-zoom aspect-[4/3] overflow-hidden transition-all ${
                        activeImage === i ? 'ring-2 ring-gold' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${room.name} view ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </FadeUp>

              {/* Amenities */}
              <FadeUp delay={0.2}>
                <h2 className="mt-12 font-serif text-2xl text-charcoal md:text-3xl">
                  Room Amenities
                </h2>
                <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                  {(room.amenities || []).map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-3 text-sm text-charcoal"
                    >
                      <Check size={16} className="shrink-0 text-gold" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </FadeUp>
            </div>

            {/* Booking sidebar */}
            <ImageReveal direction="right">
              <div className="sticky top-32 bg-ice p-8">
                <p className="font-serif text-3xl text-charcoal">
                  {room.currency} {Number(room.price || 0).toLocaleString()}
                  <span className="text-base text-muted"> / night</span>
                </p>

                <ul className="mt-6 space-y-4 border-t border-ice-dark pt-6">
                  <li className="flex items-center gap-3 text-sm text-charcoal">
                    <Users size={18} className="text-gold" />
                    Up to {room.guests} guests
                  </li>
                  <li className="flex items-center gap-3 text-sm text-charcoal">
                    <Maximize2 size={18} className="text-gold" />
                    {room.size}
                  </li>
                  <li className="flex items-center gap-3 text-sm text-charcoal">
                    <BedDouble size={18} className="text-gold" />
                    {room.beds}
                  </li>
                </ul>

                {submitted ? (
                  <div className="mt-8 text-center">
                    <p className="font-serif text-xl text-charcoal">Inquiry Sent</p>
                    <p className="mt-3 text-xs text-muted">
                      Thank you. Our team will contact you soon to confirm room availability.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6 w-full"
                      onClick={() => {
                        setSubmitted(false)
                        setError('')
                      }}
                    >
                      Send Another Inquiry
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    {paymentMessage && (
                      <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                          <p>{paymentMessage}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Full Name
                      </label>
                      <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Email</label>
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Phone</label>
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>

                    <label className="flex items-start gap-3 text-sm text-charcoal">
                      <input
                        type="checkbox"
                        name="is_booking_for_other"
                        checked={formData.is_booking_for_other}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <span>I am booking for someone else</span>
                    </label>

                    {formData.is_booking_for_other && (
                      <div className="space-y-4 border-y border-ice-dark py-4">
                        <div>
                          <label className="text-xs tracking-wider uppercase text-muted">Staying Guest Name</label>
                          <input type="text" name="staying_guest_name" required value={formData.staying_guest_name} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                        </div>
                        <div>
                          <label className="text-xs tracking-wider uppercase text-muted">Staying Guest Phone</label>
                          <input type="tel" name="staying_guest_phone" required value={formData.staying_guest_phone} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                        </div>
                        <div>
                          <label className="text-xs tracking-wider uppercase text-muted">Staying Guest Email</label>
                          <input type="email" name="staying_guest_email" value={formData.staying_guest_email} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                        </div>
                        <div>
                          <label className="text-xs tracking-wider uppercase text-muted">Staying Guest Note</label>
                          <textarea name="staying_guest_note" rows={2} value={formData.staying_guest_note} onChange={handleChange} className="mt-1 w-full resize-none border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Check In</label>
                      <input type="date" name="check_in_date" required min={new Date().toISOString().slice(0, 10)} value={formData.check_in_date} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Check Out</label>
                      <input type="date" name="check_out_date" required min={formData.check_in_date || new Date().toISOString().slice(0, 10)} value={formData.check_out_date} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Guests</label>
                      <select name="guests" required value={formData.guests} onChange={handleChange} className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold">
                        {Array.from({ length: Number(room.guests || 6) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">Message</label>
                      <textarea name="message" rows={3} value={formData.message} onChange={handleChange} className="mt-1 w-full resize-none border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold" />
                    </div>

                    {checkingAvailability && (
                      <p className="text-xs text-muted">Checking room availability...</p>
                    )}

                    {availabilityWarning && (
                      <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <div className="flex items-start gap-3">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                          <div>
                            <p>{availabilityWarning}</p>
                            <Link
                              to="/"
                              className="mt-2 inline-block text-xs font-medium tracking-wider uppercase underline"
                            >
                              View available rooms from home search
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading || checkingAvailability || isRoomUnavailable}>
                      {loading ? 'Processing...' : checkingAvailability ? 'Checking...' : 'Continue to Payment'}
                    </Button>
                  </form>
                )}

                <p className="mt-4 text-center text-xs text-muted">
                  Your room hold starts only after you continue to payment
                </p>
              </div>
            </ImageReveal>
          </div>
        </div>
      </section>



      {lightboxOpen && images[activeImage] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxOpen(false)
            if (e.key === 'ArrowLeft') showPreviousImage()
            if (e.key === 'ArrowRight') showNextImage()
          }}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={images[activeImage]}
              src={images[activeImage]}
              alt={`${room.name} view ${activeImage + 1}`}
              className="max-h-[82vh] w-full animate-[roomImageFade_0.28s_ease] object-cover"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg transition hover:scale-105 hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg transition hover:scale-105 hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
                  {activeImage + 1}/{images.length}
                </div>
              </>
            )}
          </div>

          <style>{`
            @keyframes roomImageFade {
              from {
                opacity: 0;
                transform: scale(1.02);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}

      {/* Related rooms */}
      <section className="bg-ice-light py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp>
            <h2 className="mb-10 text-center font-serif text-3xl text-charcoal">
              You May Also Like
            </h2>
          </FadeUp>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {relatedRooms.map((r, i) => (
              <RoomCard key={r.id} room={r} index={i} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
