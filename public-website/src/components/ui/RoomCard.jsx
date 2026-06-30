import { Link } from 'react-router-dom'
import { Users, Maximize2 } from 'lucide-react'
import FadeUp from './FadeUp'

/**
 * Reusable room card with hover zoom image effect.
 */
export default function RoomCard({ room, index = 0, variant = 'default', searchQuery = '' }) {
  const isCompact = variant === 'compact'
  const roomUrl = `/rooms/${room.slug || room.id}${searchQuery ? `?${searchQuery}` : ''}`

  return (
    <FadeUp delay={index * 0.1}>
      <Link to={roomUrl} className="group block">
        <div className="image-zoom relative aspect-[4/5] overflow-hidden bg-ice">
          <img
            src={(room.images && room.images[0]) || room.main_image}
            alt={room.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* Price badge */}
          <div className="absolute right-4 top-4 bg-white/95 px-4 py-2 backdrop-blur-sm">
            <span className="text-xs tracking-wider text-muted">From</span>
            <p className="font-serif text-lg text-charcoal">{room.currency} {Number(room.price || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className={`${isCompact ? 'mt-4' : 'mt-6'} space-y-2`}>
          <p className="text-xs tracking-[0.2em] uppercase text-gold">{room.type}</p>
          <h3 className="font-serif text-xl text-charcoal transition-colors group-hover:text-gold md:text-2xl">
            {room.name}
          </h3>
          {!isCompact && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted">
              {room.description}
            </p>
          )}
          <div className="flex items-center gap-4 pt-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {room.guests || room.max_guests} Guests
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 size={14} />
              {room.size}
            </span>
          </div>
          <span className="inline-block pt-2 text-xs font-medium tracking-[0.2em] uppercase text-charcoal underline-offset-4 transition-all group-hover:text-gold group-hover:underline">
            Explore
          </span>
        </div>
      </Link>
    </FadeUp>
  )
}
