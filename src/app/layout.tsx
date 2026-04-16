import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HCWBB Summer Workout',
  description: 'Haverford Women\'s Basketball Summer Workout Competition',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  )
}
