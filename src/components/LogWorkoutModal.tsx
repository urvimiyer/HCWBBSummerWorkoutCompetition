'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Camera } from 'lucide-react'
import type { WorkoutType } from '@/types/database'

interface Props {
  seasonId: string
  groupId: string
  defaultWorkoutTypeId?: string
  onClose: () => void
}

export default function LogWorkoutModal({ seasonId, groupId, defaultWorkoutTypeId, onClose }: Props) {
  const router = useRouter()
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([])
  const [workoutTypeId, setWorkoutTypeId] = useState(defaultWorkoutTypeId ?? '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Date limits: today and up to 3 days back
  const today = new Date().toISOString().split('T')[0]
  const minDate = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]

  useEffect(() => {
    const supabase = createClient()
    supabase.from('workout_types').select('*').eq('active', true).order('name').then(({ data }) => {
      if (data) {
        setWorkoutTypes(data)
        if (!defaultWorkoutTypeId && data.length > 0) setWorkoutTypeId(data[0].id)
      }
    })
  }, [defaultWorkoutTypeId])

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workoutTypeId) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    let photoUrl: string | null = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `entries/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, photo)
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
      photoUrl = urlData.publicUrl
    }

    const selectedType = workoutTypes.find(t => t.id === workoutTypeId)
    const { error: insertError } = await supabase.from('entries').insert({
      user_id: user.id,
      group_id: groupId,
      season_id: seasonId,
      workout_type_id: workoutTypeId,
      points: selectedType?.point_value ?? 5,
      date,
      note: note.trim() || null,
      photo_url: photoUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-24 shadow-xl overflow-y-auto max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Log Workout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">💪</div>
            <p className="text-lg font-bold text-[#C8102E]">Logged! +5 points</p>
            <p className="text-sm text-gray-500">Keep it up!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Workout type</label>
              <select
                value={workoutTypeId}
                onChange={e => setWorkoutTypeId(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] bg-white"
              >
                {workoutTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.point_value} pts</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                min={minDate}
                max={today}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note <span className="text-gray-400 font-normal">(optional, max 100 chars)</span>
              </label>
              <input
                type="text"
                value={note}
                maxLength={100}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                placeholder="e.g. 2 mile run on the ERC trail"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{note.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Photo proof <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {photoPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center gap-1 text-gray-400 hover:border-[#C8102E] hover:text-[#C8102E] transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">Tap to upload photo</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>

            <button
              type="submit"
              disabled={loading || !workoutTypeId}
              className="w-full bg-[#C8102E] text-white rounded-xl py-3.5 font-bold text-sm disabled:opacity-60 hover:bg-[#a50d25] transition-colors"
            >
              {loading ? 'Logging…' : 'Log Workout (+5 pts)'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
