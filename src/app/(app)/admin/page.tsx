import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [
    { data: seasons },
    { data: groups },
    { data: profiles },
    { data: workoutTypes },
    { data: invites },
  ] = await Promise.all([
    supabase.from('seasons').select('*').order('year', { ascending: false }),
    supabase.from('groups').select('*').order('name'),
    supabase.from('profiles').select('*').order('name'),
    supabase.from('workout_types').select('*').order('name'),
    supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const activeSeason = seasons?.find(s => s.is_active) ?? null

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Admin Panel</h1>
      <p className="text-sm text-gray-500 mb-5">Manage the summer competition</p>
      <AdminClient
        seasons={seasons ?? []}
        activeSeason={activeSeason}
        groups={groups ?? []}
        profiles={profiles ?? []}
        workoutTypes={workoutTypes ?? []}
        invites={invites ?? []}
        adminId={user!.id}
      />
    </div>
  )
}
