import { createClient } from '@/lib/supabase/server'
import MyLogClient from '@/components/MyLogClient'

export default async function MyLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  const { data: entries } = await supabase
    .from('entries')
    .select('*, workout_types(name, point_value)')
    .eq('user_id', user!.id)
    .eq('season_id', season?.id ?? '')
    .order('date', { ascending: false })

  const { data: workoutTypes } = await supabase
    .from('workout_types')
    .select('*')
    .eq('active', true)

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-5">My Log</h1>
      <MyLogClient
        entries={entries ?? []}
        workoutTypes={workoutTypes ?? []}
        currentUserId={user!.id}
        seasonId={season?.id ?? null}
        groupId={null}
      />
    </div>
  )
}
