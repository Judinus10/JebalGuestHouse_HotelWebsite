import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'
import Button from '@/components/ui/Button'
import { useContactSettings } from '@/hooks/useContactSettings'

export default function ContactPreview() {
  const { settings } = useContactSettings()

  const items = [
    { icon: MapPin, text: settings.address },
    { icon: Phone, text: settings.phone },
    { icon: Mail, text: settings.email },
    { icon: Clock, text: settings.business_hours },
  ].filter((item) => item.text)

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeUp>
            <p className="mb-4 text-xs font-medium tracking-[0.3em] uppercase text-gold">
              Get In Touch
            </p>

            <h2 className="font-serif text-3xl text-charcoal md:text-4xl lg:text-5xl">
              Plan Your Visit
            </h2>

            <p className="mt-6 text-sm leading-relaxed text-muted md:text-base">
              Contact {settings.business_name} for room availability, booking inquiries,
              family stays, short stays, and any simple requests before arrival.
            </p>

            <ul className="mt-8 space-y-5">
              {items.map(({ icon: Icon, text }) => (
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

          <FadeUp delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden bg-ice lg:aspect-auto lg:h-full lg:min-h-[400px]">
              {settings.map_embed_url ? (
                <iframe
                  src={settings.map_embed_url}
                  title={`${settings.business_name} map`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80"
                    alt="Map location placeholder"
                    className="h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-charcoal/10">
                    <div className="bg-white px-8 py-6 text-center shadow-lg">
                      <MapPin className="mx-auto text-gold" size={28} />
                      <p className="mt-3 font-serif text-lg text-charcoal">
                        {settings.business_name}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {settings.address || 'Sri Lanka'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}