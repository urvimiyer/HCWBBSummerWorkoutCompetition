'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import type { WorkoutType } from '@/types/database'

interface EntryWithType {
  id: string
  user_id: string
  date: string
  points: number
  note: string | null
  photo_url: string | null
  created_at: string
  edited_at: string | null
  workout_type_id: string
  workout_types: { name: string; point_value: number } | null
}

interface Props {
  entries: EntryWithType[]
  workoutTypes: WorkoutType[]
  currentUserId: string
  seasonId: string | null
  groupId: string | null
}

export default function MyLogClient({ entries, workoutTypes, currentUserId, seasonId, groupId }: Props) {
  const router = useRouter()

  // Stats
  const totalPoints = entries.reduce((s, e) => s + e.points, 0)
  const typeCounts: Record<string, number> = {}
  for (const e of entries) {
    const name = e.workout_types?.name ?? 'Unknown'
    typeCounts[name] = (typeCounts[name] ?? 0) + 1
  }

  // Streak
  const streak = computeStreak(entries.map(e => e.date))

  // Group by month
  const byMonth: Record<string, EntryWithType[]> = {}
  for (const e of entries) {
    const key = e.date.slice(0, 7) // YYYY-MM
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(e)
  }
  const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total pts" value={totalPoints.toString()} />
        <StatCard label="Workouts" value={entries.length.toString()} />
        <StatCard label="Streak 🔥" value={`${streak}d`} />
      </div>

      {/* Breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown</h3>
          <div className="space-y-1.5">
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <div key={name} className="flex justify-between text-sm text-gray-600">
                <span className="truncate">{name}</span>
                <span className="font-semibold ml-2">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly log */}
      {months.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-12">No workouts logged yet. Start today!</p>
      )}
      {months.map(month => {
        const monthEntries = byMonth[month]
        const monthTotal = monthEntries.reduce((s, e) => s + e.points, 0)
        const date = new Date(month + '-01')
        const label = date.toLocaleString('default', { month: 'long', year: 'numeric' })
        return (
          <div key={month}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700">{label}</h3>
              <span className="text-sm font-bold text-[#003087]">{monthTotal} pts</span>
            </div>
            <div className="space-y-2">
              {monthEntries.map(entry => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  workoutTypes={workoutTypes}
                  currentUserId={currentUserId}
                  onMutate={() => router.refresh()}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
      <p className="text-xl font-bold text-[#003087]">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function EntryRow({ entry, workoutTypes, currentUserId, onMutate }: {
  entry: EntryWithType
  workoutTypes: WorkoutType[]
  currentUserId: string
  onMutate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(entry.note ?? '')
  const [workoutTypeId, setWorkoutTypeId] = useState(entry.workout_type_id)
  const [saving, setSaving] = useState(false)

  const canEdit = Date.now() - new Date(entry.created_at).getTime() < 48 * 3600 * 1000
  const isOwn = entry.user_id === currentUserId

  async function saveEdit() {
    setSaving(true)
    const supabase = createClient()
    const selectedType = workoutTypes.find(t => t.id === workoutTypeId)
    await supabase.from('entries').update({
      note: note.trim() || null,
      workout_type_id: workoutTypeId,
      points: selectedType?.point_value ?? entry.points,
      edited_at: new Date().toISOString(),
    }).eq('id', entry.id)
    setSaving(false)
    setEditing(false)
    onMutate()
  }

  async function deleteEntry() {
    if (!confirm('Delete this workout entry?')) return
    const supabase = createClient()
    await supabase.from('entries').delete().eq('id', entry.id)
    onMutate()
  }

  const dateStr = new Date(entry.date + 'T12:00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      {editing ? (
        <div className="space-y-2">
          <select
            value={workoutTypeId}
            onChange={e => setWorkoutTypeId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003087]"
          >
            {workoutTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={100}
            placeholder="Note (optional)"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#003087]"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="flex-1 bg-[#003087] text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600 flex items-center justify-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">{entry.workout_types?.name ?? 'Workout'}</span>
              <span className="text-xs text-[#003087] font-bold shrink-0">+{entry.points}</span>
              {entry.photo_url && <span className="text-xs">📸</span>}
              {entry.edited_at && <span className="text-xs text-gray-400">edited</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
            {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
          </div>
          {isOwn && canEdit && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-500 p-1">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={deleteEntry} className="text-gray-300 hover:text-red-500 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  let streak = 0
  let current = today
  for (const d of unique) {
    if (d === current) {
      streak++
      const prev = new Date(new Date(current).getTime() - 86400000)
      current = prev.toISOString().split('T')[0]
    } else if (d < current) {
      break
    }
  }
  return streak
}
