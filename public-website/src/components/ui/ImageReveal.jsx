import { motion } from 'framer-motion'

/**
 * Image reveal animation — slides and fades in from a direction.
 */
export default function ImageReveal({
  children,
  className = '',
  direction = 'left',
  delay = 0,
}) {
  const directionMap = {
    left: { x: -60, y: 0 },
    right: { x: 60, y: 0 },
    up: { x: 0, y: 60 },
    down: { x: 0, y: -60 },
  }

  const offset = directionMap[direction] || directionMap.left

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
