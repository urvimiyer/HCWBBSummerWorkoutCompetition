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
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
      <div className="bg-white/90 backdrop-blur-xl border-t border-[#e2eaf5]">
        <div className="flex">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                  active ? 'text-[#003087]' : 'text-[#8aa0bb] hover:text-[#4a6080]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`}
                />
                <span>{label}</span>
                {active && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-[#003087] rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
