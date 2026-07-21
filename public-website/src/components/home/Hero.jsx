import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import hero01 from '../../assets/images/home/home-hero-01.webp'
import hero02 from '../../assets/images/home/home-hero-02.webp'
import hero03 from '../../assets/images/home/home-hero-03.webp'

const slides = [
  { src: hero01, alt: 'Luxury guest house exterior at dusk' },
  { src: hero02, alt: 'Luxury swimming pool and relaxation area' },
  { src: hero03, alt: 'Tropical guest house pool and garden' },
]

const AUTOPLAY_DELAY = 6500
const SWIPE_DISTANCE = 45

/**
 * Jebal home hero with a smooth, automatic crossfade slideshow.
 * The copy stays fixed while only the background scene changes.
 */
export default function Hero() {
  const sectionRef = useRef(null)
  const touchStartX = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length)
  }, [])

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    slides.forEach(({ src }) => {
      const image = new Image()
      image.src = src
    })
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!isPageVisible) return undefined
    const timer = window.setInterval(showNext, AUTOPLAY_DELAY)
    return () => window.clearInterval(timer)
  }, [isPageVisible, showNext])

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const distance = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(distance) < SWIPE_DISTANCE) return
    if (distance < 0) showNext()
    else showPrevious()
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[85vh] min-h-[500px] overflow-hidden md:h-[90vh]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Jebal Guest House highlights"
    >
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 -top-[10%] h-[120%]">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeIndex}
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.4 : 1.5, ease: 'easeInOut' }}
          >
            <motion.img
              src={slides[activeIndex].src}
              alt={slides[activeIndex].alt}
              className="h-full w-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: reduceMotion ? 1 : 1.05 }}
              transition={{ duration: AUTOPLAY_DELAY / 1000 + 1, ease: 'linear' }}
              draggable="false"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/55" />

      <motion.div
        style={{ opacity: contentOpacity }}
        className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center text-white"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-4 text-xs tracking-[0.4em] uppercase text-white/80"
        >
          Welcome to Jebal Guest House
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-4xl font-serif text-4xl leading-tight md:text-6xl lg:text-7xl"
        >
          A Clean and Comfortable Guest House Stay
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-6 max-w-xl text-sm leading-relaxed text-white/80 md:text-base"
        >
          A peaceful place with comfortable rooms, attached bathrooms, air
          conditioning, WiFi, parking, and easy booking inquiries.
        </motion.p>
      </motion.div>

    </section>
  )
}
