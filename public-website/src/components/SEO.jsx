import { useEffect } from 'react'

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://jebalguesthouse.com').replace(/\/$/, '')
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
}

function absoluteUrl(value) {
  if (!value) return DEFAULT_IMAGE
  if (/^https?:\/\//i.test(value)) return value
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

export default function SEO({
  title,
  description,
  path = '/',
  image,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  type = 'website',
  structuredData,
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`
    const socialImage = absoluteUrl(image)

    document.title = title
    document.documentElement.lang = 'en'
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots })
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: robots })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImage })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Jebal Guest House' })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_LK' })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImage })

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    document.head.querySelectorAll('script[data-jebal-jsonld]').forEach((node) => node.remove())
    const entries = (Array.isArray(structuredData) ? structuredData : [structuredData]).filter(Boolean)
    entries.forEach((entry, index) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.jebalJsonld = String(index)
      script.textContent = JSON.stringify(entry).replace(/</g, '\\u003c')
      document.head.appendChild(script)
    })

    return () => {
      document.head.querySelectorAll('script[data-jebal-jsonld]').forEach((node) => node.remove())
    }
  }, [description, image, path, robots, structuredData, title, type])

  return null
}
