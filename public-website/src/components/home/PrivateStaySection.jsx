import FadeUp from '../ui/FadeUp'
import ImageReveal from '../ui/ImageReveal'
import Button from '../ui/Button'
import comfortMainImage from '../../assets/images/home/home-comfort-main.webp'
import comfortDetailImage from '../../assets/images/home/home-comfort-detail.webp'

/**
 * Private stay / room collection section with overlapping editorial images.
 */
export default function PrivateStaySection() {
  return (
    <section className="bg-ice py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Overlapping image composition */}
          <ImageReveal direction="left">
            <div className="relative mx-auto max-w-lg">
              {/* Main oval image */}
              <div className="aspect-[3/4] overflow-hidden rounded-[50%]">
                <img
                  src={comfortMainImage}
                  alt="Comfortable guest house room"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Overlapping rectangular image */}
              <div className="absolute -bottom-8 -right-4 w-2/3 overflow-hidden shadow-xl md:-right-8">
                <img
                  src={comfortDetailImage}
                  alt="Clean room interior detail"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </ImageReveal>

          {/* Text content */}
          <FadeUp>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] uppercase text-gold">
              Guest House Stay
            </p>
            <h2 className="font-serif text-3xl leading-tight text-charcoal md:text-4xl lg:text-5xl">
              Your Comfortable Stay Awaits
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">
              Jebal Guest House offers a simple and peaceful stay with rooms arranged
              for everyday comfort. Guests can choose from ground floor rooms,
              first floor rooms, a family room, or a private cottage.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              Whether you are visiting with family, as a couple, or for a short
              stay, our team makes booking inquiries easy and keeps the stay
              clean, calm, and practical.
            </p>
            <Button to="/rooms" className="mt-8">
              View Rooms
            </Button>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
