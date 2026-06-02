import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: entry } = await supabase.from('entries').select('user_id, created_at').eq('id', id).single()
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = entry.user_id === user.id
  const within48h = Date.now() - new Date(entry.created_at).getTime() < 48 * 3600 * 1000
  if (!isOwner || !within48h) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const body = await req.json()
  const admin = createAdminClient()
  const { error } = await admin.from('entries').update({
    note: body.note,
    workout_type_id: body.workout_type_id,
    points: body.points,
    edited_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: entry } = await admin.from('entries').select('user_id, created_at').eq('id', id).single()
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = entry.user_id === user.id
  const within48h = Date.now() - new Date(entry.created_at).getTime() < 48 * 3600 * 1000

  if (!isAdmin && !(isOwner && within48h)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { error } = await admin.from('entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
