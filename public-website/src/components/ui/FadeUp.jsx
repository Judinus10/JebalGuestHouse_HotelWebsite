import { motion } from 'framer-motion'

/**
 * Reusable fade-up animation wrapper for scroll-triggered sections.
 */
export default function FadeUp({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  y = 40,
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
