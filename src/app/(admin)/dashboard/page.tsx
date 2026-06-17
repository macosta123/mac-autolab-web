'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calendar, Users, Car, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Stat = { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }

const STATUS_COLORS: Record<string, string> = {
  pendente: '#F59E0B',
  em_andamento: '#3B82F6',
  concluido: '#10B981',
  cancelado: '#EF4444',
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ agendamentos: 0, clientes: 0, veiculos: 0, receitaMes: 0 })
  const [porStatus, setPorStatus] = useState<{ name: string; value: number }[]>([])
  const [porDia, setPorDia] = useState<{ dia: string; total: number }[]>([])
  const [proximos, setProximos] = useState<any[]>([])

  useEffect(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd')
    const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const fimMes = format(endOfMonth(new Date()), 'yyyy-MM-dd')

    Promise.all([
      supabase.from('agendamentos').select('id', { count: 'exact' }),
      supabase.from('clientes').select('id', { count: 'exact' }),
      supabase.from('veiculos').select('id', { count: 'exact' }),
      supabase.from('agendamentos').select('valor_reserva').eq('status_pagamento', 'pago').gte('data', inicioMes).lte('data', fimMes),
      supabase.from('agendamentos').select('status'),
      supabase.from('agendamentos').select('data').gte('data', format(subDays(new Date(), 6), 'yyyy-MM-dd')).lte('data', hoje),
      supabase.from('agendamentos').select('*, veiculo:veiculos(marca, modelo, placa, cliente:clientes(nome))').gte('data', hoje).order('data').order('hora').limit(5),
    ]).then(([ag, cl, ve, receita, status, dias, prox]) => {
      const receitaTotal = (receita.data ?? []).reduce((s: number, r: any) => s + (r.valor_reserva ?? 0), 0)

      // Agrupamento por status
      const statusCount: Record<string, number> = {}
      ;(status.data ?? []).forEach((a: any) => { statusCount[a.status] = (statusCount[a.status] ?? 0) + 1 })
      setPorStatus(Object.entries(statusCount).map(([name, value]) => ({ name, value })))

      // Agrupamento por dia
      const diaCount: Record<string, number> = {}
      ;(dias.data ?? []).forEach((a: any) => { diaCount[a.data] = (diaCount[a.data] ?? 0) + 1 })
      const ultimos7 = Array.from({ length: 7 }, (_, i) => {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
        return { dia: format(subDays(new Date(), 6 - i), 'EEE', { locale: ptBR }), total: diaCount[d] ?? 0 }
      })
      setPorDia(ultimos7)

      setStats({ agendamentos: ag.count ?? 0, clientes: cl.count ?? 0, veiculos: ve.count ?? 0, receitaMes: receitaTotal })
      setProximos(prox.data ?? [])
      setLoading(false)
    })
  }, [])

  const statsCards: Stat[] = [
    { label: 'Agendamentos', value: stats.agendamentos, icon: Calendar, color: 'text-[#C9A84C]', sub: 'total' },
    { label: 'Clientes', value: stats.clientes, icon: Users, color: 'text-blue-400', sub: 'cadastrados' },
    { label: 'Veículos', value: stats.veiculos, icon: Car, color: 'text-purple-400', sub: 'cadastrados' },
    { label: 'Receita do Mês', value: `R$ ${stats.receitaMes.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', sub: 'em reservas pagas' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#666] text-sm mt-1">{format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#AAA] text-xs font-semibold uppercase tracking-wider">{label}</p>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-[#666] text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Agendamentos por dia */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#C9A84C]" />
            Agendamentos — últimos 7 dias
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={porDia}>
              <XAxis dataKey="dia" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#C9A84C' }} />
              <Bar dataKey="total" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Agendamentos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por status */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-[#C9A84C]" />
            Status dos Agendamentos
          </h2>
          {porStatus.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[#666] text-sm">Sem dados</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={porStatus} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {porStatus.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#666'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {porStatus.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] ?? '#666' }} />
                      <span className="text-xs text-[#AAA] capitalize">{s.name.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#C9A84C]" />
          Próximos Agendamentos
        </h2>
        {proximos.length === 0 ? (
          <p className="text-[#666] text-sm text-center py-6">Nenhum agendamento futuro</p>
        ) : (
          <div className="space-y-2">
            {proximos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-[#111] rounded-lg border border-[#2A2A2A]">
                <div className="text-center min-w-[48px]">
                  <p className="text-[#C9A84C] font-bold text-sm">{a.hora?.slice(0,5)}</p>
                  <p className="text-[#666] text-xs">{format(new Date(a.data + 'T12:00'), 'dd/MM')}</p>
                </div>
                <div className="w-px h-8 bg-[#2A2A2A]" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.servico}</p>
                  <p className="text-[#666] text-xs truncate">
                    {a.veiculo?.cliente?.nome} · {a.veiculo?.marca} {a.veiculo?.modelo}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  a.status === 'concluido' ? 'bg-green-900/40 text-green-400' :
                  a.status === 'em_andamento' ? 'bg-blue-900/40 text-blue-400' :
                  a.status === 'cancelado' ? 'bg-red-900/40 text-red-400' :
                  'bg-yellow-900/40 text-yellow-400'
                }`}>
                  {a.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
