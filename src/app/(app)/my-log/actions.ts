'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteWorkoutEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  const [{ data: profile }, { data: entry }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).single(),
    admin.from('entries').select('user_id, created_at').eq('id', id).single(),
  ])

  if (!entry) throw new Error('Entry not found')

  const isAdmin = profile?.role === 'admin'
  const isOwner = entry.user_id === user.id
  const within48h = Date.now() - new Date(entry.created_at).getTime() < 48 * 3600 * 1000

  if (!isAdmin && !(isOwner && within48h)) throw new Error('Not authorized')

  const { error } = await admin.from('entries').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/my-log')
}
