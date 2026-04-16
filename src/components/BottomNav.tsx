'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Rss, User, Settings } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/standings', label: 'Standings', icon: Trophy },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/my-log', label: 'My Log', icon: User },
]

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const items = isAdmin
    ? [...navItems, { href: '/admin', label: 'Admin', icon: Settings }]
    : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-lg mx-auto">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? 'text-[#003087]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
