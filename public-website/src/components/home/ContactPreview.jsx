import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import FadeUp from '../ui/FadeUp'
import Button from '../ui/Button'

/**
 * Contact preview section with map placeholder for the homepage.
 */
export default function ContactPreview() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Contact info */}
          <FadeUp>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] uppercase text-gold">
              Get In Touch
            </p>
            <h2 className="font-serif text-3xl text-charcoal md:text-4xl lg:text-5xl">
              Plan Your Visit
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">
              Contact Jebal Homes for room availability, booking inquiries,
              family stays, short stays, and any simple requests before arrival.
            </p>

            <ul className="mt-8 space-y-5">
              {[
                { icon: MapPin, text: 'Jebal Homes, Sri Lanka' },
                { icon: Phone, text: '+94 77 000 0000' },
                { icon: Mail, text: 'info@jebalhomes.com' },
                { icon: Clock, text: 'Daily · 7:00 AM – 10:00 PM' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4 text-sm text-charcoal">
                  <span className="flex h-10 w-10 items-center justify-center bg-ice text-gold">
                    <Icon size={18} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Button to="/contact" variant="outline" className="mt-8">
              Contact Us
            </Button>
          </FadeUp>

          {/* Map placeholder */}
          <FadeUp delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden bg-ice lg:aspect-auto lg:h-full lg:min-h-[400px]">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                alt="Map location placeholder"
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal/10">
                <div className="bg-white px-8 py-6 text-center shadow-lg">
                  <MapPin className="mx-auto text-gold" size={28} />
                  <p className="mt-3 font-serif text-lg text-charcoal">Jebal Homes</p>
                  <p className="mt-1 text-xs text-muted">Sri Lanka</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
