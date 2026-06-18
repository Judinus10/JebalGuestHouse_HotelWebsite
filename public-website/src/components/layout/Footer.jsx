import { Link } from 'react-router-dom'
import { Globe, Share2, Mail } from 'lucide-react'

const footerLinks = [
  { label: 'Rooms', path: '/rooms' },
  { label: 'Contact', path: '/contact' },
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Service', path: '#' },
]

/**
 * Site footer with navigation, social links, and contact info.
 */
export default function Footer() {
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
            {[Globe, Share2, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-all hover:border-gold hover:text-gold-light"
                aria-label="Social link"
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
          <div>
            <p className="font-serif text-2xl">Jebal Homes</p>
            <p className="mt-1 text-xs tracking-[0.3em] uppercase text-white/40">
              Comfortable Guest House
            </p>
          </div>

          <div className="text-sm text-white/60">
            <p>Jebal Homes, Sri Lanka</p>
            <p className="mt-1">+94 77 000 0000 · info@jebalhomes.com</p>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Jebal Homes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
