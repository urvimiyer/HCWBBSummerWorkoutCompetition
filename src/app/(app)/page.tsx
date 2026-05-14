import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogWorkoutButton from '@/components/LogWorkoutButton'
import GroupStandingsPreview from '@/components/GroupStandingsPreview'
import type { Profile, Season } from '@/types/database'
import { ChevronRight, Flame, Users } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profileRaw }, { data: seasonRaw }] = await Promise.all([
    supabase.from('profiles').select('*, groups!group_id(name)').eq('id', user!.id).single(),
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

  const firstName = profile?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Greeting */}
      <div>
        <h2 className="font-condensed text-4xl font-bold text-[#0f1f3d] tracking-wide uppercase">
          Hey, {firstName}
        </h2>
        <p className="text-[#8aa0bb] text-xs mt-1 tracking-widest uppercase">
          {monthName} Competition — Live
        </p>
      </div>

      {/* Log workout card */}
      <div className="relative bg-gradient-to-br from-[#003087] to-[#1a3d7c] rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-[#003087]/20">
        {/* Pastel glow accents */}
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-[#dce8ff]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-4 left-8 w-24 h-24 bg-[#C99700]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-[#fde68a]" />
            <p className="text-[#bfcfef] text-xs font-semibold tracking-widest uppercase">Ready to log?</p>
          </div>
          <h3 className="font-condensed text-2xl font-bold mb-4 tracking-wide uppercase">
            Log Today&apos;s Workout
          </h3>
          <LogWorkoutButton
            seasonId={season?.id ?? null}
            groupId={profile?.group_id ?? null}
            lastEntry={lastEntry}
          />
        </div>
      </div>

      {/* My Group card */}
      {profile?.group_id && (
        <div className="bg-white rounded-2xl border border-[#e2eaf5] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#eef3ff] flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-[#003087]" />
              </div>
              <div>
                <p className="text-[10px] text-[#8aa0bb] font-semibold tracking-widest uppercase">My Group</p>
                <p className="text-sm font-bold text-[#0f1f3d]">{profile.groups?.name ?? '—'}</p>
              </div>
            </div>
            <Link
              href={`/groups/${profile.group_id}`}
              className="flex items-center gap-0.5 text-xs text-[#003087] font-semibold hover:text-[#1a4fa0] transition-colors cursor-pointer"
            >
              View <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Standings */}
      {season && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-condensed text-lg font-bold text-[#0f1f3d] tracking-wide uppercase">
              {monthName} Standings
            </h3>
            <Link
              href="/standings"
              className="flex items-center gap-0.5 text-xs text-[#003087] font-semibold hover:text-[#1a4fa0] transition-colors cursor-pointer"
            >
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <GroupStandingsPreview seasonId={season.id} currentGroupId={profile?.group_id ?? null} />
        </div>
      )}

      {!season && (
        <div className="bg-[#fef9ec] border border-[#f5e098] rounded-xl p-4 text-sm text-[#7c5d00]">
          No active competition yet. Check back soon!
        </div>
      )}
    </div>
  )
}
