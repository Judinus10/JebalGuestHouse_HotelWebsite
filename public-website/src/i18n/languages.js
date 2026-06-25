export const LANGUAGES = [
  { code: 'en', apiCode: 'en', label: 'English', dir: 'ltr' },
  { code: 'si', apiCode: 'si', label: 'Sinhala', dir: 'ltr' },
  { code: 'ta', apiCode: 'ta', label: 'Tamil', dir: 'ltr' },
  { code: 'zh-CN', apiCode: 'zh-CN', label: 'Chinese (Simplified)', dir: 'ltr' },
  { code: 'ru', apiCode: 'ru', label: 'Russian', dir: 'ltr' },
  { code: 'de', apiCode: 'de', label: 'German', dir: 'ltr' },
  { code: 'fr', apiCode: 'fr', label: 'French', dir: 'ltr' },
  { code: 'ar', apiCode: 'ar', label: 'Arabic', dir: 'rtl' },
]

export const DEFAULT_LANGUAGE = LANGUAGES[0]

export function getLanguageByCode(code) {
  return LANGUAGES.find((language) => language.code === code) || DEFAULT_LANGUAGE
}
