import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Rooms', path: '/rooms' },
  { label: 'Experience', path: '/#experience' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
]

/**
 * Sticky navbar with scroll-based background transition and mobile menu.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  // Toggle solid background after scrolling past hero
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const showSolid = scrolled || !isHome

  return (
    <>
      {/* Top utility bar */}
      <div
        className={`hidden border-b border-white/10 bg-charcoal text-white transition-all md:block ${
          showSolid ? 'opacity-100' : 'opacity-90'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs tracking-wider">
          <span className="text-white/60">English</span>
          <Link to="/rooms" className="hover:text-gold-light transition-colors">
            Find a Room
          </Link>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          showSolid
            ? 'bg-white/95 shadow-sm backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:py-5">
          {/* Logo */}
          <Link to="/" className="group flex flex-col items-start">
            <span
              className={`font-serif text-2xl tracking-wide transition-colors md:text-3xl ${
                showSolid ? 'text-charcoal' : 'text-white'
              } group-hover:text-gold`}
            >
              Jebal Homes
            </span>
            <span
              className={`text-[10px] tracking-[0.35em] uppercase ${
                showSolid ? 'text-muted' : 'text-white/70'
              }`}
            >
              Guest House
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`text-xs font-medium tracking-[0.2em] uppercase transition-colors hover:text-gold ${
                    showSolid ? 'text-charcoal' : 'text-white'
                  } ${
                    location.pathname === link.path ||
                    (link.path !== '/' && location.pathname.startsWith(link.path.split('#')[0]) && !link.path.includes('#'))
                      ? 'text-gold'
                      : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-4">
            <Button
              to="/rooms"
              variant={showSolid ? 'primary' : 'outline'}
              className={`hidden sm:inline-flex ${
                !showSolid ? '!border-white !text-white hover:!bg-white hover:!text-charcoal' : ''
              }`}
            >
              Reserve Now
            </Button>

            <button
              type="button"
              className={`lg:hidden ${showSolid ? 'text-charcoal' : 'text-white'}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {mobileOpen && (
          <div className="border-t border-ice bg-white px-6 py-6 lg:hidden">
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="block text-sm font-medium tracking-[0.15em] uppercase text-charcoal hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button to="/rooms" className="mt-6 w-full">
              Reserve Now
            </Button>
          </div>
        )}
      </header>
    </>
  )
}
