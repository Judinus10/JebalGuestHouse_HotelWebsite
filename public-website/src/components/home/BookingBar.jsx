import { useState } from 'react'
import { Calendar, Users, BedDouble, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FadeUp from '../ui/FadeUp'

const roomTypes = [
  'All Rooms',
  'Ground Floor',
  'First Floor',
  'Family Room',
  'Private Cottage',
]

/**
 * Floating booking search bar — sits below the hero section.
 * Sends the selected filters to /rooms. UI classes are kept unchanged.
 */
export default function BookingBar() {
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')
  const [roomType, setRoomType] = useState('All Rooms')
  const [error, setError] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    setError('')

    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      setError('Select both check-in and check-out dates.')
      return
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out date must be after check-in date.')
      return
    }

    const params = new URLSearchParams()

    if (checkIn) params.set('checkin', checkIn)
    if (checkOut) params.set('checkout', checkOut)
    if (guests) params.set('guests', guests)
    if (roomType && roomType !== 'All Rooms') params.set('room_type', roomType)

    navigate(`/rooms${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="relative z-10 -mt-16 px-4 md:-mt-20 md:px-6">
      <FadeUp>
        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-6xl bg-white p-6 shadow-xl md:p-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {/* Check-in */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Calendar size={14} />
                Check In
              </label>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
              />
            </div>

            {/* Check-out */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Calendar size={14} />
                Check Out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
              />
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <Users size={14} />
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Guest{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Room type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-muted">
                <BedDouble size={14} />
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full border-b border-ice-dark bg-transparent py-2 text-sm text-charcoal outline-none focus:border-gold"
              >
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Search button */}
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

          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
        </form>
      </FadeUp>
    </div>
  )
}
