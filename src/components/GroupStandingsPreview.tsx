import { createClient } from '@/lib/supabase/server'

interface Props {
  seasonId: string
  currentGroupId: string | null
}

export default async function GroupStandingsPreview({ seasonId, currentGroupId }: Props) {
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('season_id', seasonId)

  if (!groups?.length) return null

  // Sum points per group
  const { data: entries } = await supabase
    .from('entries')
    .select('group_id, points')
    .eq('season_id', seasonId)
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])

  const totals: Record<string, number> = {}
  for (const g of groups) totals[g.id] = 0
  for (const e of entries ?? []) {
    if (totals[e.group_id] !== undefined) totals[e.group_id] += e.points
  }

  const ranked = [...groups].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
  const max = ranked[0] ? totals[ranked[0].id] : 1

  return (
    <div className="space-y-2">
      {ranked.map((g, i) => {
        const pts = totals[g.id] ?? 0
        const isMe = g.id === currentGroupId
        const pct = max > 0 ? Math.round((pts / max) * 100) : 0
        return (
          <div
            key={g.id}
            className={`bg-white rounded-xl border p-3 ${isMe ? 'border-[#003087]' : 'border-gray-100'}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                <span className={`text-sm font-semibold ${isMe ? 'text-[#003087]' : 'text-gray-800'}`}>
                  {g.name} {isMe && <span className="text-xs text-[#C99700]">(you)</span>}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">{pts} pts</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isMe ? 'bg-[#003087]' : 'bg-gray-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
