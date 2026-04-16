'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { WebGLShader } from '@/components/ui/web-gl-shader'
import { Dumbbell } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <WebGLShader />

      {/* Soft light overlay — lets the shader peek through gently */}
      <div className="fixed inset-0 bg-white/55 z-[1]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#dce8ff] shadow-lg shadow-[#003087]/10 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[#003087]" />
          </div>
          <h1 className="font-condensed text-4xl font-bold text-[#003087] tracking-widest uppercase">HCWBB</h1>
          <p className="text-[#4a6080] text-xs mt-1 tracking-[0.2em] uppercase">Summer Workout Competition</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-2xl p-6 space-y-4 shadow-xl shadow-[#003087]/8"
        >
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-3 py-2 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-[#4a6080] mb-1.5 tracking-widest uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#f4f7ff] border border-[#dce8ff] rounded-xl px-4 py-2.5 text-sm text-[#0f1f3d] placeholder-[#8aa0bb] focus:outline-none focus:border-[#003087]/40 focus:ring-2 focus:ring-[#003087]/10 transition-all duration-200"
              placeholder="you@haverford.edu"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#4a6080] mb-1.5 tracking-widest uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#f4f7ff] border border-[#dce8ff] rounded-xl px-4 py-2.5 text-sm text-[#0f1f3d] placeholder-[#8aa0bb] focus:outline-none focus:border-[#003087]/40 focus:ring-2 focus:ring-[#003087]/10 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003087] hover:bg-[#1a4fa0] active:scale-[0.98] text-white rounded-xl py-3 text-sm font-semibold tracking-wide disabled:opacity-50 transition-all duration-200 shadow-md shadow-[#003087]/25 cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2eaf5]" />
            </div>
            <div className="relative flex justify-center">
              <span className="text-xs text-[#8aa0bb] bg-white/80 px-3">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full bg-[#f4f7ff] hover:bg-[#eef3ff] active:scale-[0.98] border border-[#dce8ff] rounded-xl py-3 text-sm font-medium text-[#0f1f3d] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-xs text-[#8aa0bb] mt-5">
          Have an invite link?{' '}
          <Link href="/invite" className="text-[#003087] font-semibold hover:text-[#1a4fa0] transition-colors">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}
