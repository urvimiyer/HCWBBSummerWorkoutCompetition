'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, ChevronDown } from 'lucide-react'

const EMOJIS = ['👏', '💪', '🔥', '❤️'] as const

interface Comment { id: string; user_id: string; text: string; created_at: string; profiles: { name: string } | null }
interface Reaction { id: string; user_id: string; emoji: string }
interface Entry {
  id: string
  user_id: string
  points: number
  date: string
  note: string | null
  photo_url: string | null
  created_at: string
  profiles: { id: string; name: string } | null
  workout_types: { name: string } | null
  reactions: Reaction[]
  comments: Comment[]
}

export default function FeedClient({ entries, currentUserId }: { entries: Entry[]; currentUserId: string }) {
  const router = useRouter()

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No workouts logged in the last 7 days.</p>
  }

  return (
    <div className="space-y-4">
      {entries.map(entry => (
        <FeedCard key={entry.id} entry={entry} currentUserId={currentUserId} onMutate={() => router.refresh()} />
      ))}
    </div>
  )
}

function FeedCard({ entry, currentUserId, onMutate }: { entry: Entry; currentUserId: string; onMutate: () => void }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Group reactions by emoji
  const reactionCounts: Record<string, { count: number; mine: boolean }> = {}
  for (const r of entry.reactions) {
    if (!reactionCounts[r.emoji]) reactionCounts[r.emoji] = { count: 0, mine: false }
    reactionCounts[r.emoji].count++
    if (r.user_id === currentUserId) reactionCounts[r.emoji].mine = true
  }

  async function toggleReaction(emoji: string) {
    const supabase = createClient()
    const mine = reactionCounts[emoji]?.mine
    if (mine) {
      const myReaction = entry.reactions.find(r => r.user_id === currentUserId && r.emoji === emoji)
      if (myReaction) await supabase.from('reactions').delete().eq('id', myReaction.id)
    } else {
      await supabase.from('reactions').insert({ entry_id: entry.id, user_id: currentUserId, emoji })
    }
    onMutate()
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('comments').insert({ entry_id: entry.id, user_id: currentUserId, text: commentText.trim() })
    setCommentText('')
    setSubmitting(false)
    onMutate()
  }

  const timeAgo = getTimeAgo(entry.created_at)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{entry.profiles?.name ?? 'Unknown'}</p>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[#C8102E]">+{entry.points} pts</p>
          <p className="text-xs text-gray-500">{entry.workout_types?.name}</p>
        </div>
      </div>

      {/* Photo */}
      {entry.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.photo_url} alt="Workout" className="w-full max-h-64 object-cover" />
      )}

      {/* Note */}
      {entry.note && (
        <p className="px-4 py-2 text-sm text-gray-700">{entry.note}</p>
      )}

      {/* Reactions */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        {EMOJIS.map(emoji => {
          const data = reactionCounts[emoji]
          return (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className={`flex items-center gap-1 text-sm px-2.5 py-1 rounded-full border transition-colors ${
                data?.mine ? 'bg-[#C8102E]/10 border-[#C8102E]/30 text-[#C8102E]' : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}
            >
              {emoji} {data?.count ? <span className="text-xs">{data.count}</span> : null}
            </button>
          )
        })}
        <button
          onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto"
        >
          <MessageCircle className="w-4 h-4" />
          {entry.comments.length > 0 && entry.comments.length}
          <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-2">
          {entry.comments.map(c => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold text-gray-800">{c.profiles?.name?.split(' ')[0]} </span>
              <span className="text-gray-600">{c.text}</span>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2 mt-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={300}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="text-sm font-semibold text-[#C8102E] disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function getTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
