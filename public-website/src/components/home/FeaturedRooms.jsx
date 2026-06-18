import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFeaturedRooms } from '../../data/rooms'
import SectionHeading from '../ui/SectionHeading'
import FadeUp from '../ui/FadeUp'

/**
 * Featured rooms carousel with overlapping text card.
 */
export default function FeaturedRooms() {
  const featured = getFeaturedRooms()
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % featured.length)
  const prev = () => setCurrent((prev) => (prev - 1 + featured.length) % featured.length)

  const room = featured[current]

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          subtitle="Where To Stay"
          title="Featured Rooms"
          description="Comfortable room options for families, couples, and short stays at Jebal Homes."
        />

        <FadeUp>
          <div className="relative">
            {/* Main carousel image */}
            <div className="relative aspect-[16/9] overflow-hidden md:aspect-[21/9]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={room.id}
                  src={room.images[0]}
                  alt={room.name}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6 }}
                />
              </AnimatePresence>
            </div>

            {/* Overlapping text card */}
            <div className="relative mx-4 -mt-16 bg-white p-8 shadow-lg md:absolute md:bottom-12 md:right-12 md:mx-0 md:max-w-md md:-mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-xs tracking-[0.2em] uppercase text-gold">{room.type}</p>
                  <h3 className="mt-2 font-serif text-2xl text-charcoal md:text-3xl">
                    {room.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {room.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-serif text-xl text-charcoal">
                      From ${room.price}
                      <span className="text-sm text-muted"> / night</span>
                    </span>
                    <Link
                      to={`/rooms/${room.id}`}
                      className="text-xs font-medium tracking-[0.2em] uppercase text-charcoal underline-offset-4 hover:text-gold hover:underline"
                    >
                      Explore
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation controls */}
            <div className="mt-8 flex items-center justify-center gap-6 md:mt-0 md:absolute md:bottom-12 md:left-12">
              <button
                type="button"
                onClick={prev}
                className="flex h-12 w-12 items-center justify-center border border-charcoal/20 transition-colors hover:border-gold hover:text-gold"
                aria-label="Previous room"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`h-0.5 transition-all duration-300 ${
                      i === current ? 'w-8 bg-gold' : 'w-4 bg-charcoal/20'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="flex h-12 w-12 items-center justify-center border border-charcoal/20 transition-colors hover:border-gold hover:text-gold"
                aria-label="Next room"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
