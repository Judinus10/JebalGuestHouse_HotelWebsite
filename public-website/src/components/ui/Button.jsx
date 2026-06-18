import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-charcoal text-white hover:bg-charcoal-light border border-charcoal',
  outline:
    'bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-white',
  gold: 'bg-gold text-white hover:bg-gold-light border border-gold',
  ghost: 'bg-transparent text-charcoal hover:text-gold border-none',
}

/**
 * Reusable button component with consistent styling variants.
 */
export default function Button({
  children,
  variant = 'primary',
  to,
  href,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center px-8 py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer'

  const combined = `${baseStyles} ${variants[variant] || variants.primary} ${className}`

  if (to) {
    return (
      <Link to={to} className={combined} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={combined} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={combined} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
