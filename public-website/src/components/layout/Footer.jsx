import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { FaFacebookF, FaInstagram } from 'react-icons/fa'
import companyLogo from '../../assets/company_logo.png'

import { API_BASE_URL } from '@/services/config'
const CONTACT_SETTINGS_API_URL = `${API_BASE_URL}/settings/get-contact.php`

const footerLinks = [
  { label: 'Rooms', path: '/rooms' },
  { label: 'Contact', path: '/contact' },
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Terms of Service', path: '/terms-of-service' },
]

const fallbackSettings = {
  business_name: 'Jebal Guest House',
  address: 'Jebal Guest House, Sri Lanka',
  phone: '+94 77 000 0000',
  email: 'info@jebalhomes.com',
  facebook_link: '',
  instagram_link: '',
}

export default function Footer() {
  const [settings, setSettings] = useState(fallbackSettings)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const response = await fetch(CONTACT_SETTINGS_API_URL, {
          headers: {
            Accept: 'application/json',
          },
        })

        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Could not load footer settings.')
        }

        if (active) {
          setSettings({
            ...fallbackSettings,
            ...(result.data || {}),
          })
        }
      } catch (error) {
        console.warn('Using fallback footer settings:', error)
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  const socialLinks = [
    {
      icon: FaFacebookF,
      href: settings.facebook_link || '#',
      label: 'Facebook',
    },
    {
      icon: FaInstagram,
      href: settings.instagram_link || '#',
      label: 'Instagram',
    },
    {
      icon: Mail,
      href: settings.email ? `mailto:${settings.email}` : '#',
      label: 'Email',
    },
  ]

  return (
    <footer className="bg-charcoal text-white">
      {/* Top tier */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 md:flex-row">
          <ul className="flex flex-wrap justify-center gap-6 text-xs tracking-wider uppercase">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.path}
                  className="text-white/60 transition-colors hover:text-gold-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:border-gold hover:text-gold-light"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tier */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">

          {/* Hotel Info - Unchanged */}
          <div>
            <p className="font-serif text-2xl">{settings.business_name}</p>
            <p className="mt-1 text-xs tracking-[0.3em] uppercase text-white/40">
              Comfortable Guest House
            </p>
          </div>

          {/* Contact Info - Unchanged */}
          <div className="text-sm text-white/60">
            <p>{settings.address}</p>
            <p className="mt-1">
              {settings.phone} · {settings.email}
            </p>
          </div>

          {/* Copyright + CompylX */}
          <div className="text-center md:text-right">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} {settings.business_name}. All rights reserved.
            </p>

            <div className="mt-4 flex flex-col items-center md:items-end">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                Powered by
              </span>

              <img
                src={companyLogo}
                alt="CompylX"
                className="mt-2 w-16 h-auto object-contain opacity-90 transition-opacity duration-300 hover:opacity-100"
                width="256"
                height="199"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
