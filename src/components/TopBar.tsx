'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#003087] text-white max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🏀</span>
          <span className="font-bold text-sm tracking-wide">HCWBB Summer</span>
        </Link>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-xs text-blue-200">{profile.name.split(' ')[0]}</span>
          )}
          <button
            onClick={signOut}
            className="text-xs text-blue-200 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
