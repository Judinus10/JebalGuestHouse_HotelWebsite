import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, getLanguageByCode } from './languages'

const STORAGE_KEY = 'jebal_guest_house_language'
const CACHE_KEY = 'jebal_guest_house_translation_cache_v1'
const MAX_TEXT_LENGTH = 450
const TRANSLATE_API = 'https://api.mymemory.translated.net/get'

const LanguageContext = createContext(null)

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage can fail in private mode. Translation still works without cache.
  }
}

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function shouldSkipTranslation(text) {
  const value = cleanText(text)

  if (!value) return true
  if (value.length > MAX_TEXT_LENGTH) return true
  if (/^[\d\s.,:;!?()[\]{}+\-/%&|@#$*_=<>]+$/.test(value)) return true
  if (/^[A-Z]{2,6}$/.test(value)) return true
  if (/^USD\b/i.test(value)) return true
  if (/^\+?\d[\d\s()-]+$/.test(value)) return true

  return false
}

async function translateWithMyMemory(text, targetLanguage) {
  const q = cleanText(text)
  const url = `${TRANSLATE_API}?q=${encodeURIComponent(q)}&langpair=en|${encodeURIComponent(targetLanguage.apiCode)}`

  const response = await fetch(url)
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.responseData?.translatedText) {
    throw new Error('Translation failed')
  }

  return data.responseData.translatedText
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return getLanguageByCode(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE.code)
    } catch {
      return DEFAULT_LANGUAGE
    }
  })

  const setLanguage = useCallback((code) => {
    const nextLanguage = getLanguageByCode(code)
    setLanguageState(nextLanguage)

    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage.code)
    } catch {
      // Ignore storage failure.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language.code
    document.documentElement.dir = language.dir
  }, [language])

  const translateText = useCallback(
    async (text) => {
      const original = cleanText(text)

      if (language.code === 'en' || shouldSkipTranslation(original)) {
        return original
      }

      const cache = readCache()
      const cacheKey = `${language.code}::${original}`

      if (cache[cacheKey]) {
        return cache[cacheKey]
      }

      try {
        const translated = await translateWithMyMemory(original, language)

        if (!translated) return original

        cache[cacheKey] = translated
        writeCache(cache)

        return translated
      } catch (error) {
        console.warn('Translation failed:', error)
        return original
      }
    },
    [language],
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      translateText,
    }),
    [language, setLanguage, translateText],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
