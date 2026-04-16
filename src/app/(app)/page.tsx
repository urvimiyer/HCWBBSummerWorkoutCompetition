import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogWorkoutButton from '@/components/LogWorkoutButton'
import GroupStandingsPreview from '@/components/GroupStandingsPreview'
import type { Profile, Season } from '@/types/database'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profileRaw }, { data: seasonRaw }] = await Promise.all([
    supabase.from('profiles').select('*, groups(name)').eq('id', user!.id).single(),
    supabase.from('seasons').select('*').eq('is_active', true).single(),
  ])

  const profile = profileRaw as (Profile & { groups: { name: string } | null }) | null
  const season = seasonRaw as Season | null

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let lastEntry: { workout_type_id: string; workout_types: { name: string } | null } | null = null
  if (season) {
    const { data } = await supabase
      .from('entries')
      .select('workout_type_id, workout_types(name)')
      .eq('user_id', user!.id)
      .eq('season_id', season.id)
      .eq('date', yesterdayStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) lastEntry = data as { workout_type_id: string; workout_types: { name: string } | null }
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Hey {profile?.name?.split(' ')[0] ?? 'there'} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{monthName} competition is live</p>
      </div>

      <div className="bg-[#003087] rounded-2xl p-5 text-white">
        <p className="text-sm text-blue-200 mb-1">Ready to log?</p>
        <h3 className="text-lg font-bold mb-4">Log today&apos;s workout</h3>
        <LogWorkoutButton
          seasonId={season?.id ?? null}
          groupId={profile?.group_id ?? null}
          lastEntry={lastEntry}
        />
      </div>

      {profile?.group_id && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">My Group</span>
            <Link href={`/groups/${profile.group_id}`} className="text-xs text-[#003087] font-medium">View →</Link>
          </div>
          <p className="text-base font-bold text-[#003087]">{profile.groups?.name ?? '—'}</p>
        </div>
      )}

      {season && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{monthName} Standings</h3>
            <Link href="/standings" className="text-xs text-[#003087] font-medium">See all →</Link>
          </div>
          <GroupStandingsPreview seasonId={season.id} currentGroupId={profile?.group_id ?? null} />
        </div>
      )}

      {!season && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No active competition yet. Check back soon!
        </div>
      )}
    </div>
  )
}
