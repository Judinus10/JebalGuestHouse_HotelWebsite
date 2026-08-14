import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, Users, BedDouble, Search } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import RoomCard from '../components/ui/RoomCard'
import FadeUp from '../components/ui/FadeUp'
import { fetchRooms } from '../services/roomsApi'
import roomsBanner from '../assets/images/banners/rooms-banner.webp'

const roomTypes = [
  'All Rooms',
  'Ground Floor',
  'First Floor',
  'Family Room',
  'Private Cottage',
]

function readBookingFilters(searchParams) {
  const checkInDate = searchParams.get('checkin') || searchParams.get('check_in_date') || searchParams.get('check_in') || ''
  const checkOutDate = searchParams.get('checkout') || searchParams.get('check_out_date') || searchParams.get('check_out') || ''
  const guests = searchParams.get('guests') || ''
  const roomType = searchParams.get('room_type') || searchParams.get('type') || ''

  return {
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    guests,
    room_type: roomType,
  }
}

function buildRoomSearch(filters) {
  const params = new URLSearchParams()

  if (filters.check_in_date) params.set('checkin', filters.check_in_date)
  if (filters.check_out_date) params.set('checkout', filters.check_out_date)
  if (filters.guests) params.set('guests', filters.guests)
  if (filters.room_type && filters.room_type !== 'All Rooms' && filters.room_type !== 'All') {
    params.set('room_type', filters.room_type)
  }

  return params.toString()
}

/**
 * Rooms listing page with date/guest search state stored in the URL.
 * Home keeps its filter visible; Rooms only hides this page filter after a search exists.
 */
export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('All')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const bookingFilters = useMemo(() => readBookingFilters(searchParams), [searchParams])

  const [searchForm, setSearchForm] = useState({
    check_in_date: bookingFilters.check_in_date,
    check_out_date: bookingFilters.check_out_date,
    guests: bookingFilters.guests || '2',
    room_type: bookingFilters.room_type || 'All Rooms',
  })

  const hasBookingFilter = Boolean(
    bookingFilters.check_in_date
      || bookingFilters.check_out_date
      || bookingFilters.guests
      || bookingFilters.room_type
  )

  const roomSearchQuery = useMemo(() => buildRoomSearch(bookingFilters), [bookingFilters])
  const requestedGuests = Number(bookingFilters.guests || 0)
  const capacityExceeded = requestedGuests > 3

  useEffect(() => {
    setSearchForm({
      check_in_date: bookingFilters.check_in_date,
      check_out_date: bookingFilters.check_out_date,
      guests: bookingFilters.guests || '2',
      room_type: bookingFilters.room_type || 'All Rooms',
    })
  }, [bookingFilters])

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

  const capacityFilteredRooms = useMemo(() => {
    const requestedGuests = Number(bookingFilters.guests || 0)
    if (!requestedGuests) return rooms

    return rooms.filter((room) => {
      const capacity = Number(room.max_guests ?? room.guests ?? 0)
      return Number.isFinite(capacity) && capacity > 0 && capacity >= requestedGuests
    })
  }, [rooms, bookingFilters.guests])

  const availableTypes = useMemo(() => {
    const types = capacityFilteredRooms.map((room) => room.type).filter(Boolean)
    return ['All', ...new Set(types)]
  }, [capacityFilteredRooms])

  const filtered = filter === 'All'
    ? capacityFilteredRooms
    : capacityFilteredRooms.filter((room) => room.type === filter)

  const selectedStayText = bookingFilters.check_in_date && bookingFilters.check_out_date
    ? `${bookingFilters.check_in_date} to ${bookingFilters.check_out_date}`
    : ''

  const handleSearchFormChange = (e) => {
    const { name, value } = e.target
    setFormError('')
    setSearchForm((current) => ({ ...current, [name]: value }))
  }

  const handleRoomSearch = (e) => {
    e.preventDefault()
    setFormError('')

    if ((searchForm.check_in_date && !searchForm.check_out_date) || (!searchForm.check_in_date && searchForm.check_out_date)) {
      setFormError('Select both check-in and check-out dates.')
      return
    }

    if (searchForm.check_in_date && searchForm.check_out_date && searchForm.check_out_date <= searchForm.check_in_date) {
      setFormError('Check-out date must be after check-in date.')
      return
    }

    if (Number(searchForm.guests) > 3) {
      setFormError('A single room can accommodate a maximum of 3 guests. Please reduce the guest count or contact the property for multiple-room arrangements.')
      return
    }

    const query = buildRoomSearch(searchForm)
    setSearchParams(query ? new URLSearchParams(query) : new URLSearchParams())
  }

  return (
    <PageTransition>
      {/* Page header banner */}
      <section className="relative flex h-[40vh] min-h-[300px] items-end bg-charcoal">
        <img
          src={roomsBanner}
          alt="Jebal Guest House guest rooms"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          width="1942"
          height="809"
          fetchPriority="high"
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
            title="Rooms at Jebal Guest House"
            description="Choose ground-floor or first-floor rooms in Anaiccoddai, Jaffna. Each room has a king-size bed, accommodates up to 3 guests, and includes air conditioning, free Wi-Fi, a kitchen, refrigerator, attached bathroom, and free parking. Full-day packages are available."
          />

          <FadeUp>
            <form
              onSubmit={handleRoomSearch}
              className="mx-auto mb-12 max-w-6xl border border-ice-dark bg-white p-6 shadow-sm md:p-8"
            >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                      <Calendar size={14} />
                      Check In
                    </label>
                    <input
                      type="date"
                      name="check_in_date"
                      value={searchForm.check_in_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={handleSearchFormChange}
                      className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                      <Calendar size={14} />
                      Check Out
                    </label>
                    <input
                      type="date"
                      name="check_out_date"
                      value={searchForm.check_out_date}
                      min={searchForm.check_in_date || new Date().toISOString().split('T')[0]}
                      onChange={handleSearchFormChange}
                      className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                      <Users size={14} />
                      Guests
                    </label>
                    <select
                      name="guests"
                      value={searchForm.guests}
                      onChange={handleSearchFormChange}
                      className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} Guest{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                      <BedDouble size={14} />
                      Room Type
                    </label>
                    <select
                      name="room_type"
                      value={searchForm.room_type}
                      onChange={handleSearchFormChange}
                      className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
                    >
                      {roomTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end sm:col-span-2 lg:col-span-1">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 bg-charcoal px-6 py-3.5 text-xs font-medium tracking-[0.2em] uppercase text-white transition-colors hover:bg-charcoal-light"
                    >
                      <Search size={16} />
                      Search
                    </button>
                  </div>
                </div>

                {formError && <p className="mt-4 text-xs text-red-600">{formError}</p>}
            </form>
          </FadeUp>

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
                  <RoomCard key={room.id} room={room} index={index} searchQuery={roomSearchQuery} />
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="py-16 text-center text-muted">
                  {capacityExceeded
                    ? `No single room can accommodate ${requestedGuests} guests. Each room supports up to 3 guests. Please reduce the guest count above or contact the property for multiple-room arrangements.`
                    : hasBookingFilter
                    ? 'No rooms are available for the selected dates. Change the search details above and select Search again.'
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
