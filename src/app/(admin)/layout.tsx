'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  Package, DollarSign, Globe, LogOut, Menu, X
} from 'lucide-react'

const nav = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/agendamentos', label: 'Agendamentos',  icon: Calendar },
  { href: '/clientes',     label: 'Clientes',      icon: Users },
  { href: '/ordens',       label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/estoque',      label: 'Estoque',        icon: Package },
  { href: '/financeiro',   label: 'Financeiro',     icon: DollarSign },
  { href: '/',             label: 'Ver Site',       icon: Globe },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user.email ?? '')
    })
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#111] border-r border-[#2A2A2A] w-60">
      {/* Logo */}
      <div className="p-5 border-b border-[#2A2A2A]">
        <p className="text-2xl font-black tracking-[0.3em] text-white">MAC</p>
        <div className="h-px bg-[#C9A84C] w-16 my-1" />
        <p className="text-[#C9A84C] text-xs font-bold tracking-[0.3em]">AUTO LAB</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-[#C9A84C] text-[#0D0D0D] font-bold'
                  : 'text-[#AAA] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#2A2A2A]">
        <p className="text-xs text-[#666] truncate px-3 mb-2">{user}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-[#AAA] hover:bg-[#1A1A1A] hover:text-red-400 transition"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#0D0D0D] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-shrink-0"><Sidebar /></div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#2A2A2A] bg-[#111]">
          <button onClick={() => setOpen(!open)} className="text-[#C9A84C]">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <p className="font-bold tracking-widest text-white">MAC AUTO LAB</p>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
