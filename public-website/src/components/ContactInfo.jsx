import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

function phoneHref(number) {
  return `tel:${String(number || '').replace(/[^\d+]/g, '')}`
}

function whatsappHref(number) {
  return `https://wa.me/${String(number || '').replace(/[^\d]/g, '')}`
}

export default function ContactInfo({ settings, compact = false }) {
  const details = [
    {
      icon: Phone,
      label: 'Main Phone',
      value: settings.phone,
      href: phoneHref(settings.phone),
    },
    {
      icon: Phone,
      label: 'Secondary Phone',
      value: settings.reception_contact_number,
      href: phoneHref(settings.reception_contact_number),
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Reservations',
      value: settings.whatsapp_reservation_number,
      href: whatsappHref(settings.whatsapp_reservation_number),
      external: true,
    },
    {
      icon: Mail,
      label: 'Email',
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: settings.address,
      href: settings.google_maps_url || null,
      external: Boolean(settings.google_maps_url),
    },
  ].filter((item) => item.value)

  return (
    <div className={compact ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2'}>
      {details.map(({ icon: Icon, label, value, href, external }) => {
        const content = (
          <div className="flex gap-3 border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-ice text-gold">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-charcoal">{value}</p>
            </div>
          </div>
        )

        return href ? (
          <a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {content}
          </a>
        ) : (
          <div key={label}>{content}</div>
        )
      })}
    </div>
  )
}
