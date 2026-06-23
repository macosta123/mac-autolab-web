'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#C9A84C] mb-4">
            <span className="text-2xl">🔧</span>
          </div>
          <h1 className="text-4xl font-black tracking-[0.3em] text-white">MAC</h1>
          <div className="h-px bg-[#C9A84C] w-32 mx-auto my-2" />
          <p className="text-[#C9A84C] text-sm font-bold tracking-[0.4em]">AUTO LAB</p>
          <p className="text-[#666] text-xs tracking-widest mt-2">PAINEL ADMINISTRATIVO</p>
        </div>

        {/* Form */}
        <form onSubmit={login} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] text-[#0D0D0D] font-black py-3 rounded-lg text-sm tracking-widest hover:bg-[#E8C97A] transition disabled:opacity-50"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}
