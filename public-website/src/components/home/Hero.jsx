import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * Full-width hero with parallax image effect.
 */
export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative h-[85vh] min-h-[500px] overflow-hidden md:h-[90vh]">
      {/* Parallax background image */}
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80"
          alt="Jebal Guest House guest house exterior"
          className="h-[120%] w-full object-cover"
        />
      </motion.div>

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />

      {/* Hero content */}
      <motion.div
        style={{ opacity }}
        className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white"
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
