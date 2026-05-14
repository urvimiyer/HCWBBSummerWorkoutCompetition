'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, LogOut } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto">
      <div className="bg-white/85 backdrop-blur-xl border-b border-[#e8e8e8]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-[#ffe4e6] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-[#C8102E]" />
            </div>
            <span className="font-condensed text-base font-bold tracking-widest text-[#C8102E] uppercase">
              HC<span className="text-[#111111]">WBB</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-xs text-[#555555] font-medium tracking-wide">
                {profile.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-[#888888] hover:text-[#C8102E] transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
