import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { testimonials } from '../../data/testimonials'
import SectionHeading from '../ui/SectionHeading'
import FadeUp from '../ui/FadeUp'

/**
 * Guest testimonials carousel section.
 */
export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prev = () =>
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const testimonial = testimonials[current]

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const starValue = i + 1
      const isFull = rating >= starValue
      const isHalf = rating >= starValue - 0.5 && rating < starValue

      return (
        <span key={i} className="relative inline-flex">
          <Star size={16} className="text-gold/30" />

          {isFull && (
            <Star
              size={16}
              className="absolute left-0 top-0 fill-gold text-gold"
            />
          )}

          {isHalf && (
            <span className="absolute left-0 top-0 w-1/2 overflow-hidden">
              <Star size={16} className="fill-gold text-gold" />
            </span>
          )}
        </span>
      )
    })
  }

  return (
    <section className="pattern-diamond py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <SectionHeading subtitle="Guest Stories" title="What Our Guests Say" />

        <FadeUp>
          <div className="relative mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-6 flex justify-center gap-1">
                  {renderStars(testimonial.rating)}
                </div>

                <blockquote className="font-serif text-xl leading-relaxed text-charcoal md:text-2xl lg:text-3xl">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <div className="mt-8">
                  <p className="text-sm font-medium tracking-wider text-charcoal">
                    {testimonial.author}
                  </p>
                  <p className="mt-1 text-xs text-muted">{testimonial.location}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={prev}
                className="text-charcoal/40 transition-colors hover:text-gold"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === current ? 'w-6 bg-gold' : 'w-1.5 bg-charcoal/20'
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                className="text-charcoal/40 transition-colors hover:text-gold"
                aria-label="Next testimonial"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}