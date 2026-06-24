import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router does not reload the browser document between pages,
 * so scroll position can be carried from one route to the next.
 * This keeps every new page/search result starting from the top.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        return
      }
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [pathname, search, hash])

  return null
}
