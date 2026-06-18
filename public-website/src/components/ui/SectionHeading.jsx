import FadeUp from './FadeUp'

/**
 * Section heading with optional subtitle and serif typography.
 */
export default function SectionHeading({
  subtitle,
  title,
  description,
  align = 'center',
  light = false,
  className = '',
}) {
  const alignClass =
    align === 'left'
      ? 'text-left'
      : align === 'right'
        ? 'text-right'
        : 'text-center'

  return (
    <FadeUp className={`mb-12 md:mb-16 ${alignClass} ${className}`}>
      {subtitle && (
        <p
          className={`mb-3 text-xs font-medium tracking-[0.3em] uppercase ${
            light ? 'text-gold-light' : 'text-gold'
          }`}
        >
          {subtitle}
        </p>
      )}
      <h2
        className={`font-serif text-3xl leading-tight md:text-4xl lg:text-5xl ${
          light ? 'text-white' : 'text-charcoal'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mx-auto mt-5 max-w-2xl text-sm leading-relaxed md:text-base ${
            align === 'center' ? 'mx-auto' : ''
          } ${light ? 'text-white/70' : 'text-muted'}`}
        >
          {description}
        </p>
      )}
    </FadeUp>
  )
}
