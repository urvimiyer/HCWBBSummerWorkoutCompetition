'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    const supabase = createClient()
    supabase
      .from('invites')
      .select('id, email, used_at, expires_at')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setTokenValid(false); return }
        if (data.used_at || new Date(data.expires_at) < new Date()) { setTokenValid(false); return }
        setTokenValid(true)
        if (data.email) setEmail(data.email)
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message || 'Sign up failed')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name,
      email,
      role: 'player',
    })
    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    await supabase.from('invites').update({ used_at: new Date().toISOString() }).eq('token', token)
    router.push('/')
    router.refresh()
  }

  if (tokenValid === null) {
    return <div className="text-center text-gray-500 py-8">Checking invite…</div>
  }

  if (tokenValid === false) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-medium">Invalid or expired invite link.</p>
        <p className="text-gray-500 text-sm mt-2">Ask the admin for a new link.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
          placeholder="Min 6 characters"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C8102E] text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-[#a50d25] transition-colors"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C8102E] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏀</span>
          </div>
          <h1 className="text-2xl font-bold text-[#C8102E]">Join HCWBB Summer Workout</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500 py-8">Loading…</div>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  )
}
