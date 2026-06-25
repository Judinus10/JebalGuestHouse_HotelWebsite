import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Button from '../ui/Button'
import LanguageSwitcher from './LanguageSwitcher'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Rooms', path: '/rooms' },
  { label: 'Experience', path: '/experience' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isHome = location.pathname === '/'
  const showSolid = scrolled || !isHome

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const isActiveLink = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <>
      <div className={`navbar-topbar ${isHome ? 'home-hide-topbar' : ''}`}>
        <div className="navbar-topbar-inner">
          <LanguageSwitcher />
          <Link to="/rooms">Find a Room</Link>
        </div>
      </div>

      <header
        className={[
          'navbar-main',
          isHome ? 'navbar-home' : '',
          showSolid ? 'navbar-solid' : 'navbar-transparent',
        ].join(' ')}
      >
        <nav className="navbar-inner">
          <Link to="/" className="navbar-logo" data-no-translate>
            <span
              className={
                showSolid || mobileOpen
                  ? 'logo-title dark'
                  : 'logo-title light'
              }
            >
              Jebal Guest House
            </span>
            <span
              className={
                showSolid || mobileOpen
                  ? 'logo-sub dark'
                  : 'logo-sub light'
              }
            >
              Guest House
            </span>
          </Link>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={[
                    'navbar-link',
                    showSolid ? 'dark' : 'light',
                    isActiveLink(link.path) ? 'active' : '',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            <Button
              to="/rooms"
              variant={showSolid ? 'primary' : 'outline'}
              className={
                !showSolid
                  ? '!border-white !text-white hover:!bg-white hover:!text-charcoal home-reserve-btn'
                  : ''
              }
            >
              Reserve Now
            </Button>

            <button
              type="button"
              className={`navbar-menu-button ${
                showSolid || mobileOpen ? 'dark' : 'light'
              }`}
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="navbar-mobile">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-mobile-link ${isActiveLink(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}

            <Button to="/rooms" className="mt-6 w-full">
              Reserve Now
            </Button>
          </div>
        )}
      </header>
    </>
  )
}