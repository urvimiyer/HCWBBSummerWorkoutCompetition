'use client'

import { useState } from 'react'
import LogWorkoutModal from './LogWorkoutModal'

interface Props {
  seasonId: string | null
  groupId: string | null
  lastEntry: { workout_type_id: string; workout_types: { name: string } | null } | null
}

export default function LogWorkoutButton({ seasonId, groupId, lastEntry }: Props) {
  const [open, setOpen] = useState(false)
  const [repeatMode, setRepeatMode] = useState(false)

  if (!seasonId || !groupId) {
    return (
      <p className="text-sm text-blue-200">You haven&apos;t been assigned to a group yet.</p>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => { setRepeatMode(false); setOpen(true) }}
          className="flex-1 bg-white text-[#C8102E] font-bold rounded-xl py-3 text-sm hover:bg-blue-50 transition-colors"
        >
          + Log Workout
        </button>
        {lastEntry && (
          <button
            onClick={() => { setRepeatMode(true); setOpen(true) }}
            className="flex-1 bg-[#111111] text-white font-semibold rounded-xl py-3 text-xs hover:bg-yellow-600 transition-colors"
          >
            Repeat: {lastEntry.workout_types?.name?.split(' ')[0]}
          </button>
        )}
      </div>
      {open && (
        <LogWorkoutModal
          seasonId={seasonId}
          groupId={groupId}
          defaultWorkoutTypeId={repeatMode ? lastEntry?.workout_type_id : undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
