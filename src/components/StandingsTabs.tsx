'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Group, MonthlyResult } from '@/types/database'

interface Profile { id: string; name: string; group_id: string | null; group_id_2: string | null }
interface EntryRow { user_id: string; group_id: string; points: number; date: string }

interface Props {
  groups: Group[]
  profiles: Profile[]
  entries: EntryRow[]
  monthlyResults: MonthlyResult[]
  currentGroupId: string | null
  currentUserId: string
}

export default function StandingsTabs({ groups, profiles, entries, monthlyResults, currentGroupId, currentUserId }: Props) {
  const [tab, setTab] = useState<'groups' | 'individual' | 'history'>('groups')

  // Build user → all group IDs map (supports shared/dual-group players)
  const userGroupIds: Record<string, string[]> = {}
  for (const p of profiles) {
    userGroupIds[p.id] = [p.group_id, p.group_id_2].filter(Boolean) as string[]
  }

  // Group totals
  const groupTotals: Record<string, number> = {}
  for (const g of groups) groupTotals[g.id] = 0
  for (const e of entries) {
    const gIds = userGroupIds[e.user_id]?.length ? userGroupIds[e.user_id] : (e.group_id ? [e.group_id] : [])
    for (const gId of gIds) {
      if (groupTotals[gId] !== undefined) groupTotals[gId] += e.points
    }
  }
  const rankedGroups = [...groups].sort((a, b) => (groupTotals[b.id] ?? 0) - (groupTotals[a.id] ?? 0))
  const maxGroup = rankedGroups[0] ? groupTotals[rankedGroups[0].id] : 1

  // Individual totals
  const userTotals: Record<string, number> = {}
  for (const e of entries) { userTotals[e.user_id] = (userTotals[e.user_id] ?? 0) + e.points }
  const rankedUsers = [...profiles].sort((a, b) => (userTotals[b.id] ?? 0) - (userTotals[a.id] ?? 0))
  const maxUser = rankedUsers[0] ? userTotals[rankedUsers[0].id] ?? 0 : 1

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {(['groups', 'individual', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors capitalize ${
              tab === t ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="space-y-3">
          {rankedGroups.map((g, i) => {
            const pts = groupTotals[g.id] ?? 0
            const isMe = g.id === currentGroupId
            const pct = maxGroup > 0 ? Math.round((pts / maxGroup) * 100) : 0
            const members = profiles.filter(p => p.group_id === g.id || p.group_id_2 === g.id)
            return (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <div className={`bg-white rounded-xl border p-4 ${isMe ? 'border-[#003087]' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-[#C99700]' : 'text-gray-400'}`}>
                        {i === 0 ? '🥇' : `#${i + 1}`}
                      </span>
                      <div>
                        <p className={`text-sm font-bold ${isMe ? 'text-[#003087]' : 'text-gray-900'}`}>
                          {g.name} {isMe && <span className="text-xs text-[#C99700]">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{members.map(m => m.name.split(' ')[0]).join(', ')}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{pts}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isMe ? 'bg-[#003087]' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Individual tab */}
      {tab === 'individual' && (
        <div className="space-y-2">
          {rankedUsers.map((u, i) => {
            const pts = userTotals[u.id] ?? 0
            const isMe = u.id === currentUserId
            const pct = maxUser > 0 ? Math.round((pts / maxUser) * 100) : 0
            const group = groups.find(g => g.id === u.group_id)
            const group2 = u.group_id_2 ? groups.find(g => g.id === u.group_id_2) : null
            const groupLabel = group2 ? `${group?.name} & ${group2.name}` : group?.name
            return (
              <div key={u.id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${isMe ? 'border-[#003087]' : 'border-gray-100'}`}>
                <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-[#C99700]' : 'text-gray-400'}`}>
                  {i === 0 ? '🥇' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#003087]' : 'text-gray-900'}`}>
                      {u.name} {isMe && <span className="text-xs text-[#C99700]">(you)</span>}
                    </p>
                    <span className="text-sm font-bold text-gray-900 ml-2">{pts}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{groupLabel}</span>
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isMe ? 'bg-[#003087]' : 'bg-gray-200'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {monthlyResults.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No closed months yet.</p>
          )}
          {monthlyResults.map(r => {
            const winnerGroup = groups.find(g => g.id === r.winner_group_id)
            const groupTotalsData = r.group_totals as Record<string, number>
            const sorted = Object.entries(groupTotalsData).sort((a, b) => b[1] - a[1])
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{months[r.month - 1]} {r.year}</h3>
                  {winnerGroup && (
                    <span className="text-xs bg-[#C99700] text-white px-2 py-1 rounded-full font-semibold">
                      🏆 {winnerGroup.name}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {sorted.map(([gid, pts]) => {
                    const g = groups.find(x => x.id === gid)
                    return g ? (
                      <div key={gid} className="flex justify-between text-sm text-gray-600">
                        <span>{g.name}</span>
                        <span className="font-semibold">{pts} pts</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
