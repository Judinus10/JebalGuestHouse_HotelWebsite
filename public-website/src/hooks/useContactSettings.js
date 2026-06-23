import { useEffect, useState } from 'react'
import {
  fallbackContactSettings,
  fetchContactSettings,
} from '@/services/contactSettingsApi'

export function useContactSettings() {
  const [settings, setSettings] = useState(fallbackContactSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      setIsLoading(true)
      const data = await fetchContactSettings()

      if (active) {
        setSettings(data)
        setIsLoading(false)
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  return { settings, isLoading }
}