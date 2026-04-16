import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      id, user_id, points, date, note, photo_url, created_at,
      profiles(id, name),
      workout_types(name),
      reactions(id, user_id, emoji),
      comments(id, user_id, text, created_at, profiles(name))
    `)
    .gte('date', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-5">Team Feed</h1>
      <FeedClient entries={entries ?? []} currentUserId={user!.id} />
    </div>
  )
}
