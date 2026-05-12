import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Group, Season } from '@/types/database'

interface EntryRow { user_id: string; points: number; date: string; workout_types: { name: string } | null }
interface MemberRow { id: string; name: string; role: string; group_id: string | null; group_id_2: string | null }

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: groupRaw } = await supabase.from('groups').select('*').eq('id', id).single()
  if (!groupRaw) notFound()
  const group = groupRaw as Group

  const { data: seasonRaw } = await supabase.from('seasons').select('*').eq('is_active', true).single()
  const season = seasonRaw as Season | null

  const { data: membersRaw } = await supabase
    .from('profiles')
    .select('id, name, role, group_id, group_id_2')
    .or(`group_id.eq.${id},group_id_2.eq.${id}`)
  const members = (membersRaw ?? []) as MemberRow[]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const memberIds = members.map(m => m.id)
  const { data: entriesRaw } = memberIds.length > 0
    ? await supabase
        .from('entries')
        .select('user_id, points, date, workout_types(name)')
        .in('user_id', memberIds)
        .eq('season_id', season?.id ?? '')
        .gte('date', monthStart)
        .order('date', { ascending: false })
    : { data: [] }
  const entries = (entriesRaw ?? []) as EntryRow[]

  const memberTotals: Record<string, number> = {}
  for (const m of members) memberTotals[m.id] = 0
  for (const e of entries) memberTotals[e.user_id] = (memberTotals[e.user_id] ?? 0) + e.points
  const groupTotal = Object.values(memberTotals).reduce((s, v) => s + v, 0)

  const weekTotals: Record<number, number> = {}
  for (const e of entries) {
    const d = new Date(e.date + 'T12:00:00')
    const week = Math.ceil(d.getDate() / 7)
    weekTotals[week] = (weekTotals[week] ?? 0) + e.points
  }

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#003087]">{group.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{monthName} — {groupTotal} total pts</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Members</h3>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-800 font-medium">{m.name}</span>
                {m.group_id_2 === id && <span className="text-xs text-gray-400">(shared)</span>}
              </div>
              <span className="font-bold text-[#003087]">{memberTotals[m.id] ?? 0} pts</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{monthName} — Week by Week</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(w => {
            const pts = weekTotals[w] ?? 0
            if (w > 4 && pts === 0) return null
            return (
              <div key={w} className="flex justify-between items-center text-sm text-gray-600">
                <span>Week {w}</span>
                <span className="font-semibold">{pts} pts</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {entries.slice(0, 20).map((e, i) => {
            const member = members.find(m => m.id === e.user_id)
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-100 px-3 py-2 flex justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{member?.name?.split(' ')[0] ?? '?'}</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-600">{e.workout_types?.name}</span>
                </div>
                <span className="text-[#003087] font-bold">+{e.points}</span>
              </div>
            )
          })}
          {entries.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No entries this month.</p>
          )}
        </div>
      </div>
    </div>
  )
}
