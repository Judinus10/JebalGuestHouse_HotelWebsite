import { useEffect, useRef, useState } from 'react'
import { LANGUAGES } from '../../i18n/languages'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="language-switcher" ref={menuRef} data-no-translate>
      <button
        type="button"
        className="language-switcher-button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{language.label}</span>
        <span className="language-switcher-arrow">▼</span>
      </button>

      {open && (
        <div className="language-switcher-menu" role="listbox">
          {LANGUAGES.map((item) => (
            <button
              type="button"
              key={item.code}
              className={`language-switcher-option ${
                language.code === item.code ? 'active' : ''
              }`}
              onClick={() => {
                setLanguage(item.code)
                setOpen(false)
              }}
              role="option"
              aria-selected={language.code === item.code}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
