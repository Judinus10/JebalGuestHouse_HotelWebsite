import Navbar from './Navbar'
import Footer from './Footer'
import AutoTranslate from '../../i18n/AutoTranslate'

/**
 * Main layout wrapper — navbar, page content, footer.
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AutoTranslate />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
