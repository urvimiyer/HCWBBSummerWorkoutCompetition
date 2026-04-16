import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <TopBar profile={profile} />
      <main className="flex-1 pb-24 pt-16">
        {children}
      </main>
      <BottomNav isAdmin={profile?.role === 'admin'} />
    </div>
  )
}
