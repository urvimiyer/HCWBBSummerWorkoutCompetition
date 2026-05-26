'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Copy, Check, Lock } from 'lucide-react'
import type { Season, Group, WorkoutType, Invite } from '@/types/database'

interface Profile { id: string; name: string; email: string; role: string; group_id: string | null; group_id_2: string | null }

interface Props {
  seasons: Season[]
  activeSeason: Season | null
  groups: Group[]
  profiles: Profile[]
  workoutTypes: WorkoutType[]
  invites: Invite[]
  adminId: string
}

export default function AdminClient({ seasons, activeSeason, groups, profiles, workoutTypes, invites, adminId }: Props) {
  const [tab, setTab] = useState<'season' | 'groups' | 'workouts' | 'invites'>('season')

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {(['season', 'groups', 'workouts', 'invites'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors capitalize whitespace-nowrap px-2 ${
              tab === t ? 'bg-white text-[#C8102E] shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'season' && <SeasonTab seasons={seasons} activeSeason={activeSeason} groups={groups} profiles={profiles} />}
      {tab === 'groups' && <GroupsTab groups={groups} profiles={profiles} activeSeason={activeSeason} />}
      {tab === 'workouts' && <WorkoutsTab workoutTypes={workoutTypes} />}
      {tab === 'invites' && <InvitesTab invites={invites} adminId={adminId} />}
    </div>
  )
}

function SeasonTab({ seasons, activeSeason, groups, profiles }: { seasons: Season[]; activeSeason: Season | null; groups: Group[]; profiles: Profile[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [startDate, setStartDate] = useState('2026-06-01')
  const [endDate, setEndDate] = useState('2026-08-31')
  const [loading, setLoading] = useState(false)

  async function createSeason() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('seasons').update({ is_active: false }).eq('is_active', true)
    await supabase.from('seasons').insert({ year: new Date(startDate).getFullYear(), start_date: startDate, end_date: endDate, is_active: true })
    setCreating(false)
    setLoading(false)
    router.refresh()
  }

  async function closeMonth(month: number, year: number) {
    if (!activeSeason) return
    if (!confirm(`Close ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}? This locks scores.`)) return
    const supabase = createClient()
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: entries } = await supabase
      .from('entries')
      .select('user_id, points')
      .eq('season_id', activeSeason.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)

    const userGroupIds: Record<string, string[]> = {}
    for (const p of profiles) {
      userGroupIds[p.id] = [p.group_id, p.group_id_2].filter(Boolean) as string[]
    }

    const groupTotals: Record<string, number> = {}
    for (const g of groups) groupTotals[g.id] = 0
    for (const e of entries ?? []) {
      for (const gId of (userGroupIds[e.user_id] ?? [])) {
        if (groupTotals[gId] !== undefined) groupTotals[gId] += e.points
      }
    }

    const winnerId = Object.entries(groupTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    await supabase.from('monthly_results').upsert({
      season_id: activeSeason.id,
      month,
      year,
      group_totals: groupTotals,
      winner_group_id: winnerId,
      closed_at: new Date().toISOString(),
    }, { onConflict: 'season_id,month,year' })

    router.refresh()
    alert('Month closed! Winner saved.')
  }

  const now = new Date()

  return (
    <div className="space-y-4">
      {activeSeason ? (
        <div className="bg-white rounded-2xl border border-[#C8102E]/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[#C8102E]">Active Season</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Live</span>
          </div>
          <p className="text-sm text-gray-600">{activeSeason.start_date} → {activeSeason.end_date}</p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Close a Month</p>
            {[6, 7, 8].map(m => (
              <button
                key={m}
                onClick={() => closeMonth(m, activeSeason.year)}
                className="w-full flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors"
              >
                <span>{new Date(activeSeason.year, m - 1).toLocaleString('default', { month: 'long' })} {activeSeason.year}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><Lock className="w-3 h-3" />Close Month</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          No active season. Create one below.
        </div>
      )}

      {creating ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">New Season</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]" />
          </div>
          <div className="flex gap-2">
            <button onClick={createSeason} disabled={loading} className="flex-1 bg-[#C8102E] text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60">
              {loading ? 'Creating…' : 'Create Season'}
            </button>
            <button onClick={() => setCreating(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-[#C8102E] hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Season
        </button>
      )}

      {/* Past seasons */}
      {seasons.filter(s => !s.is_active).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Past Seasons</p>
          {seasons.filter(s => !s.is_active).map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 mb-2">
              {s.year} — {s.start_date} → {s.end_date}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupsTab({ groups, profiles, activeSeason }: { groups: Group[]; profiles: Profile[]; activeSeason: Season | null }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigningGroup, setAssigningGroup] = useState<string | null>(null)

  async function createGroup() {
    if (!activeSeason || !newGroupName.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('groups').insert({ season_id: activeSeason.id, name: newGroupName.trim() })
    setNewGroupName('')
    setCreating(false)
    setLoading(false)
    router.refresh()
  }

  async function assignPrimaryGroup(userId: string, groupId: string | null) {
    await fetch('/api/admin/assign-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId, field: 'group_id' }),
    })
    setAssigningGroup(null)
    router.refresh()
  }

  async function assignSecondaryGroup(userId: string, groupId: string | null) {
    await fetch('/api/admin/assign-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId, field: 'group_id_2' }),
    })
    setAssigningGroup(null)
    router.refresh()
  }

  const unassigned = profiles.filter(p => !p.group_id)

  return (
    <div className="space-y-4">
      {/* Groups */}
      {groups.filter(g => !activeSeason || g.season_id === activeSeason.id).map(g => {
        const primaryMembers = profiles.filter(p => p.group_id === g.id)
        const sharedMembers = profiles.filter(p => p.group_id_2 === g.id)
        const allMembers = primaryMembers.length + sharedMembers.length
        const eligibleToShare = profiles.filter(p => p.group_id !== g.id && p.group_id_2 !== g.id && p.group_id !== null)
        return (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-2">{g.name}</h3>
            <div className="space-y-1.5">
              {primaryMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{m.name}</span>
                  <button
                    onClick={() => assignPrimaryGroup(m.id, null)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {sharedMembers.map(m => (
                <div key={`shared-${m.id}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{m.name} <span className="text-xs text-gray-400">(shared)</span></span>
                  <button
                    onClick={() => assignSecondaryGroup(m.id, null)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {allMembers === 0 && <p className="text-xs text-gray-400">No members yet</p>}
            </div>
            {eligibleToShare.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                  defaultValue=""
                  onChange={e => { if (e.target.value) assignSecondaryGroup(e.target.value, g.id) }}
                >
                  <option value="">Add shared player…</option>
                  {eligibleToShare.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )
      })}

      {creating ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Group name (e.g. Group 1)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
          <div className="flex gap-2">
            <button onClick={createGroup} disabled={loading || !newGroupName.trim()} className="flex-1 bg-[#C8102E] text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60">
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button onClick={() => setCreating(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-[#C8102E] hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Group
        </button>
      )}

      {/* Unassigned users */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Unassigned Players</h3>
          <div className="space-y-2">
            {unassigned.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{u.name}</span>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
                  defaultValue=""
                  onChange={e => { if (e.target.value) assignPrimaryGroup(u.id, e.target.value) }}
                >
                  <option value="">Assign group…</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutsTab({ workoutTypes }: { workoutTypes: WorkoutType[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [points, setPoints] = useState(5)
  const [loading, setLoading] = useState(false)

  async function createType() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('workout_types').insert({ name: name.trim(), point_value: points, active: true })
    setName('')
    setPoints(5)
    setCreating(false)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('workout_types').update({ active: !active }).eq('id', id)
    router.refresh()
  }

  async function updatePoints(id: string, pts: number) {
    const supabase = createClient()
    await supabase.from('workout_types').update({ point_value: pts }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {workoutTypes.map(t => (
        <WorkoutTypeRow key={t.id} type={t} onToggle={toggleActive} onUpdatePoints={updatePoints} />
      ))}

      {creating ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Workout type name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Points:</label>
            <input
              type="number"
              value={points}
              min={1}
              onChange={e => setPoints(parseInt(e.target.value))}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={createType} disabled={loading || !name.trim()} className="flex-1 bg-[#C8102E] text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60">
              {loading ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setCreating(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-gray-400 hover:border-[#C8102E] hover:text-[#C8102E] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Workout Type
        </button>
      )}
    </div>
  )
}

function WorkoutTypeRow({ type, onToggle, onUpdatePoints }: {
  type: WorkoutType
  onToggle: (id: string, active: boolean) => void
  onUpdatePoints: (id: string, pts: number) => void
}) {
  const [editingPts, setEditingPts] = useState(false)
  const [pts, setPts] = useState(type.point_value)

  return (
    <div className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${type.active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{type.name}</p>
        {editingPts ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={pts}
              min={1}
              onChange={e => setPts(parseInt(e.target.value))}
              className="w-16 text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
            />
            <button onClick={() => { onUpdatePoints(type.id, pts); setEditingPts(false) }} className="text-xs text-[#C8102E] font-semibold">Save</button>
            <button onClick={() => setEditingPts(false)} className="text-xs text-gray-400">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditingPts(true)} className="text-xs text-gray-400 hover:text-[#C8102E] mt-0.5">
            {type.point_value} pts — edit
          </button>
        )}
      </div>
      <button
        onClick={() => onToggle(type.id, type.active)}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${type.active ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}
      >
        {type.active ? 'Disable' : 'Enable'}
      </button>
    </div>
  )
}

function InvitesTab({ invites, adminId }: { invites: Invite[]; adminId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function createInvite() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('invites').insert({ email: email.trim() || null, created_by: adminId })
    setEmail('')
    setLoading(false)
    router.refresh()
  }

  function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/invite?token=${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Create invite */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Create Invite Link</h3>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email (optional — locks link to email)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
        />
        <button
          onClick={createInvite}
          disabled={loading}
          className="w-full bg-[#C8102E] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Generate Invite Link'}
        </button>
      </div>

      {/* Existing invites */}
      <div className="space-y-2">
        {invites.map(inv => {
          const expired = new Date(inv.expires_at) < new Date()
          const used = !!inv.used_at
          return (
            <div key={inv.id} className={`bg-white rounded-xl border p-3 flex items-center gap-2 ${expired || used ? 'opacity-50' : 'border-gray-100'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{inv.email ?? 'Open invite'}</p>
                <p className="text-xs text-gray-400">
                  {used ? '✓ Used' : expired ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              {!used && !expired && (
                <button
                  onClick={() => copyLink(inv.token, inv.id)}
                  className="flex items-center gap-1 text-xs text-[#C8102E] font-semibold px-2 py-1 rounded-lg bg-blue-50"
                >
                  {copiedId === inv.id ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
