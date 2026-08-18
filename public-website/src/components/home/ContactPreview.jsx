import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'
import Button from '@/components/ui/Button'
import { useContactSettings } from '@/hooks/useContactSettings'

export default function ContactPreview() {
  const { settings } = useContactSettings()

  const items = [
    { icon: MapPin, text: settings.address, href: settings.google_maps_url },
    { icon: Phone, text: settings.phone, href: `tel:${String(settings.phone || '').replace(/[^\d+]/g, '')}` },
    { icon: Phone, text: settings.reception_contact_number, href: `tel:${String(settings.reception_contact_number || '').replace(/[^\d+]/g, '')}` },
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
              {items.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-center gap-4 text-sm text-charcoal">
                  <span className="flex h-10 w-10 items-center justify-center bg-ice text-gold">
                    <Icon size={18} />
                  </span>
                  {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="whitespace-pre-line hover:text-gold">{text}</a> : <span className="whitespace-pre-line">{text}</span>}
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
                <div className="flex h-full w-full items-center justify-center bg-ice px-8 text-center">
                  <div>
                    <MapPin className="mx-auto text-gold" size={34} />

                    <p className="mt-4 font-serif text-2xl text-charcoal">
                      {settings.business_name}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {settings.address || 'Location details will be updated soon.'}
                    </p>

                    {settings.google_maps_url ? (
                      <a href={settings.google_maps_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center justify-center border border-charcoal px-6 text-xs font-medium uppercase tracking-[0.18em] text-charcoal transition hover:bg-charcoal hover:text-white">Open in Google Maps</a>
                    ) : (
                      <Button to="/contact" variant="outline" className="mt-6">View Contact Details</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
