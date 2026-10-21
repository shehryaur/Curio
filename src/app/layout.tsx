import type { Metadata } from 'next'
import { KidRoot } from '@/components/KidRoot'
import './globals.css'

export const metadata: Metadata = {
  title: 'Curio',
  description: 'Point at any object and learn how it works, adapted to who is watching.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* k-ID wraps the whole app once: age gate + consent, then the app on pass */}
        <KidRoot>{children}</KidRoot>
      </body>
    </html>
  )
}
