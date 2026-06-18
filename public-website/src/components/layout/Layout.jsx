import Navbar from './Navbar'
import Footer from './Footer'

/**
 * Main layout wrapper — navbar, page content, footer.
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
