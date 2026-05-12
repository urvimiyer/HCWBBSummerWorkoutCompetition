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

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [{ data: profiles }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('id, group_id, group_id_2'),
    supabase.from('entries').select('user_id, points').eq('season_id', seasonId).gte('date', monthStart),
  ])

  const userGroupIds: Record<string, string[]> = {}
  for (const p of profiles ?? []) {
    userGroupIds[p.id] = [p.group_id, p.group_id_2].filter(Boolean) as string[]
  }

  const totals: Record<string, number> = {}
  for (const g of groups) totals[g.id] = 0
  for (const e of entries ?? []) {
    for (const gId of (userGroupIds[e.user_id] ?? [])) {
      if (totals[gId] !== undefined) totals[gId] += e.points
    }
  }

  const ranked = [...groups].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
  const max = ranked[0] ? totals[ranked[0].id] : 1

  const rankBadge = ['bg-[#fef3c7] text-[#92400e]', 'bg-[#f1f5f9] text-[#475569]', 'bg-[#fdf2e9] text-[#7c3d12]']

  return (
    <div className="space-y-2">
      {ranked.map((g, i) => {
        const pts = totals[g.id] ?? 0
        const isMe = g.id === currentGroupId
        const pct = max > 0 ? Math.round((pts / max) * 100) : 0

        return (
          <div
            key={g.id}
            className={`rounded-xl border p-3.5 transition-all ${
              isMe
                ? 'bg-[#eef3ff] border-[#003087]/20'
                : 'bg-white border-[#e2eaf5]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className={`font-condensed text-xs font-bold px-1.5 py-0.5 rounded-md ${rankBadge[i] ?? 'bg-[#f4f7ff] text-[#8aa0bb]'}`}>
                  #{i + 1}
                </span>
                <span className={`text-sm font-semibold ${isMe ? 'text-[#003087]' : 'text-[#0f1f3d]'}`}>
                  {g.name}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] text-[#C99700] font-bold tracking-wider uppercase">
                      you
                    </span>
                  )}
                </span>
              </div>
              <span className={`font-condensed text-sm font-bold ${isMe ? 'text-[#003087]' : 'text-[#4a6080]'}`}>
                {pts} <span className="text-[10px] font-normal opacity-60">pts</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#e2eaf5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMe ? 'bg-[#003087]' : 'bg-[#bfd0ea]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
