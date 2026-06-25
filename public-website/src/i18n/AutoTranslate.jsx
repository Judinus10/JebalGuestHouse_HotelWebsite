import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from './LanguageContext'

const TEXT_NODE = Node.TEXT_NODE
const TRANSLATED_ATTR = 'data-translated-language'
const ORIGINAL_TEXT_ATTR = 'data-original-text'
const ORIGINAL_PLACEHOLDER_ATTR = 'data-original-placeholder'

function isInsideIgnoredElement(node) {
  const element = node.nodeType === TEXT_NODE ? node.parentElement : node

  if (!element) return true

  return Boolean(
    element.closest(
      '[data-no-translate], script, style, noscript, svg, canvas, code, pre, textarea',
    ),
  )
}

function collectTextNodes(root) {
  const nodes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isInsideIgnoredElement(node)) return NodeFilter.FILTER_REJECT

      const value = node.nodeValue?.replace(/\s+/g, ' ').trim()

      if (!value) return NodeFilter.FILTER_REJECT

      return NodeFilter.FILTER_ACCEPT
    },
  })

  while (walker.nextNode()) {
    nodes.push(walker.currentNode)
  }

  return nodes
}

function collectPlaceholderElements(root) {
  return Array.from(root.querySelectorAll('input[placeholder], textarea[placeholder]')).filter(
    (element) => !element.closest('[data-no-translate]'),
  )
}

export default function AutoTranslate() {
  const location = useLocation()
  const { language, translateText } = useLanguage()

  useEffect(() => {
    let cancelled = false

    async function translatePage() {
      const body = document.body

      if (!body) return

      const textNodes = collectTextNodes(body)
      const placeholders = collectPlaceholderElements(body)

      if (language.code === 'en') {
        textNodes.forEach((node) => {
          const original = node.parentElement?.getAttribute(ORIGINAL_TEXT_ATTR)

          if (original) {
            node.nodeValue = original
            node.parentElement.removeAttribute(TRANSLATED_ATTR)
          }
        })

        placeholders.forEach((element) => {
          const original = element.getAttribute(ORIGINAL_PLACEHOLDER_ATTR)

          if (original) {
            element.placeholder = original
            element.removeAttribute(TRANSLATED_ATTR)
          }
        })

        return
      }

      for (const node of textNodes) {
        if (cancelled) return

        const parent = node.parentElement

        if (!parent) continue

        const currentText = node.nodeValue?.replace(/\s+/g, ' ').trim()

        if (!currentText) continue

        const original = parent.getAttribute(ORIGINAL_TEXT_ATTR) || currentText

        parent.setAttribute(ORIGINAL_TEXT_ATTR, original)

        if (parent.getAttribute(TRANSLATED_ATTR) === language.code) continue

        const translated = await translateText(original)

        if (cancelled) return

        node.nodeValue = node.nodeValue.replace(currentText, translated)
        parent.setAttribute(TRANSLATED_ATTR, language.code)
      }

      for (const element of placeholders) {
        if (cancelled) return

        const currentText = element.placeholder?.replace(/\s+/g, ' ').trim()

        if (!currentText) continue

        const original = element.getAttribute(ORIGINAL_PLACEHOLDER_ATTR) || currentText

        element.setAttribute(ORIGINAL_PLACEHOLDER_ATTR, original)

        if (element.getAttribute(TRANSLATED_ATTR) === language.code) continue

        const translated = await translateText(original)

        if (cancelled) return

        element.placeholder = translated
        element.setAttribute(TRANSLATED_ATTR, language.code)
      }
    }

    let timerId = window.setTimeout(translatePage, 120)

    const observer = new MutationObserver(() => {
      window.clearTimeout(timerId)
      timerId = window.setTimeout(translatePage, 250)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
      observer.disconnect()
    }
  }, [language, location.pathname, location.search, translateText])

  return null
}
