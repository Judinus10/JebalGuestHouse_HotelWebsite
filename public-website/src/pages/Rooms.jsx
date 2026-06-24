import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import RoomCard from '../components/ui/RoomCard'
import FadeUp from '../components/ui/FadeUp'
import { fetchRooms } from '../services/roomsApi'

/**
 * Rooms listing page with filter and grid layout.
 * UI and animation classes are intentionally kept from the finalized version.
 */
export default function Rooms() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const bookingFilters = useMemo(() => {
    const checkInDate = searchParams.get('check_in_date') || ''
    const checkOutDate = searchParams.get('check_out_date') || ''
    const guests = searchParams.get('guests') || ''
    const roomType = searchParams.get('room_type') || ''

    return {
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      guests,
      room_type: roomType,
    }
  }, [searchParams])

  const hasBookingFilter = Boolean(
    bookingFilters.check_in_date
      || bookingFilters.check_out_date
      || bookingFilters.guests
      || bookingFilters.room_type
  )

  useEffect(() => {
    let active = true

    async function loadRooms() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchRooms(bookingFilters)
        if (active) setRooms(data)
      } catch (err) {
        if (active) setError(err.message || 'Unable to load rooms.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRooms()

    return () => {
      active = false
    }
  }, [bookingFilters])

  useEffect(() => {
    setFilter(bookingFilters.room_type || 'All')
  }, [bookingFilters.room_type])

  const availableTypes = useMemo(() => {
    const types = rooms.map((room) => room.type).filter(Boolean)
    return ['All', ...new Set(types)]
  }, [rooms])

  const filtered =
    filter === 'All' ? rooms : rooms.filter((room) => room.type === filter)

  const selectedStayText = bookingFilters.check_in_date && bookingFilters.check_out_date
    ? `${bookingFilters.check_in_date} to ${bookingFilters.check_out_date}`
    : ''

  return (
    <PageTransition>
      {/* Page header banner */}
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src="https://images.unsplash.com/photo-1611892440506-42a832e657fb?w=1920&q=80"
          alt="Jebal Homes guest rooms"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-light">
              Accommodations
            </p>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
              Our Rooms
            </h1>
          </FadeUp>
        </div>
      </section>

      {/* Room grid */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            subtitle="Choose Your Stay"
            title="Rooms at Jebal Homes"
            description="Choose from ground floor rooms, first floor rooms, a family room, or a private cottage with practical guest house comforts."
          />

          {hasBookingFilter && (
            <FadeUp>
              <div className="mx-auto mb-10 max-w-3xl border border-gold/30 bg-gold/5 px-6 py-4 text-center">
                <p className="text-xs tracking-[0.2em] uppercase text-gold">
                  Available Room Search
                </p>
                <p className="mt-2 text-sm text-muted">
                  Showing rooms available{selectedStayText ? ` from ${selectedStayText}` : ''}
                  {bookingFilters.guests ? ` for ${bookingFilters.guests} guest${Number(bookingFilters.guests) > 1 ? 's' : ''}` : ''}.
                </p>
              </div>
            </FadeUp>
          )}

          {/* Filter tabs */}
          <FadeUp>
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`px-5 py-2.5 text-xs tracking-[0.15em] uppercase transition-all ${
                    filter === type
                      ? 'bg-charcoal text-white'
                      : 'border border-charcoal/20 text-charcoal hover:border-gold hover:text-gold'
                  }`}
                >
                  {type === 'All' ? 'All Rooms' : type}
                </button>
              ))}
            </div>
          </FadeUp>

          {loading && (
            <p className="py-16 text-center text-muted">Loading rooms...</p>
          )}

          {error && !loading && (
            <p className="py-16 text-center text-red-600">{error}</p>
          )}

          {!loading && !error && (
            <>
              {/* Room cards grid */}
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((room, index) => (
                  <RoomCard key={room.id} room={room} index={index} />
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="py-16 text-center text-muted">
                  {hasBookingFilter
                    ? 'No rooms are available for the selected dates. Try different dates or return to the home search bar.'
                    : 'No rooms found for this category.'}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
