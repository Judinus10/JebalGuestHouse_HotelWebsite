import { useState } from 'react'
import PageTransition from '../components/layout/PageTransition'
import SectionHeading from '../components/ui/SectionHeading'
import RoomCard from '../components/ui/RoomCard'
import FadeUp from '../components/ui/FadeUp'
import { rooms } from '../data/rooms'

const roomTypes = ['All', 'Ground Floor', 'First Floor', 'Family Room', 'Private Cottage']

/**
 * Rooms listing page with filter and grid layout.
 */
export default function Rooms() {
  const [filter, setFilter] = useState('All')

  const filtered =
    filter === 'All' ? rooms : rooms.filter((room) => room.type === filter)

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

          {/* Filter tabs */}
          <FadeUp>
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              {roomTypes.map((type) => (
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

          {/* Room cards grid */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room, index) => (
              <RoomCard key={room.id} room={room} index={index} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-16 text-center text-muted">
              No rooms found for this category.
            </p>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
