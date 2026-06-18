import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Users, Maximize2, BedDouble, Check, ArrowLeft } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import FadeUp from '../components/ui/FadeUp'
import ImageReveal from '../components/ui/ImageReveal'
import Button from '../components/ui/Button'
import RoomCard from '../components/ui/RoomCard'
import { getRoomById, rooms } from '../data/rooms'

const BOOKING_API_URL = '/api/submit-booking.php'
const PAYMENT_INIT_API_URL = '/api/payments/create-checkout-session.php'

/**
 * Individual room details page with gallery, amenities, and booking CTA.
 */
export default function RoomDetails() {
  const { id } = useParams()
  const room = getRoomById(id)
  const [activeImage, setActiveImage] = useState(0)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    check_in_date: '',
    check_out_date: '',
    guests: '2',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!room) return <Navigate to="/rooms" replace />

  // Suggest other rooms excluding current
  const relatedRooms = rooms.filter((r) => r.id !== room.id).slice(0, 3)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
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
          src={room.images[activeImage]}
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
                  {room.longDescription}
                </p>
              </FadeUp>

              {/* Image gallery thumbnails */}
              <FadeUp delay={0.1}>
                <div className="mt-10 grid grid-cols-3 gap-4">
                  {room.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
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
                  {room.amenities.map((amenity) => (
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
                  ${room.price}
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
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Check In
                      </label>
                      <input
                        type="date"
                        name="check_in_date"
                        required
                        value={formData.check_in_date}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Check Out
                      </label>
                      <input
                        type="date"
                        name="check_out_date"
                        required
                        value={formData.check_out_date}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Guests
                      </label>
                      <select
                        name="guests"
                        required
                        value={formData.guests}
                        onChange={handleChange}
                        className="mt-1 w-full border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} Guest{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs tracking-wider uppercase text-muted">
                        Message
                      </label>
                      <textarea
                        name="message"
                        rows={3}
                        value={formData.message}
                        onChange={handleChange}
                        className="mt-1 w-full resize-none border-b border-ice-dark bg-transparent py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Processing...' : 'Send Inquiry & Pay'}
                    </Button>
                  </form>
                )}

                <p className="mt-4 text-center text-xs text-muted">
                  Contact us to confirm room availability before arrival
                </p>
              </div>
            </ImageReveal>
          </div>
        </div>
      </section>

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
