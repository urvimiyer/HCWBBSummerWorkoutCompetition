import { createClient } from '@/lib/supabase/server'
import StandingsTabs from '@/components/StandingsTabs'

export default async function StandingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!season) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Standings</h1>
        <p className="text-gray-500 text-sm">No active competition.</p>
      </div>
    )
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [{ data: groups }, { data: profiles }, { data: entries }, { data: monthlyResults }] = await Promise.all([
    supabase.from('groups').select('*').eq('season_id', season.id),
    supabase.from('profiles').select('id, name, group_id'),
    supabase.from('entries').select('user_id, group_id, points, date').eq('season_id', season.id).gte('date', monthStart),
    supabase.from('monthly_results').select('*').eq('season_id', season.id).order('month'),
  ])

  const { data: profile } = await supabase.from('profiles').select('group_id').eq('id', user!.id).single()

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Standings</h1>
      <p className="text-sm text-gray-500 mb-5">
        {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </p>
      <StandingsTabs
        groups={groups ?? []}
        profiles={profiles ?? []}
        entries={entries ?? []}
        monthlyResults={monthlyResults ?? []}
        currentGroupId={profile?.group_id ?? null}
        currentUserId={user!.id}
      />
    </div>
  )
}
