'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
}

export async function assignPrimaryGroup(userId: string, groupId: string | null) {
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ group_id: groupId }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function assignSecondaryGroup(userId: string, groupId: string | null) {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ group_id_2: groupId }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
