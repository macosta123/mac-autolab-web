'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [resumo, setResumo] = useState({ totalPago: 0, totalPendente: 0, totalReembolsado: 0, qtdPago: 0 })
  const [porMes, setPorMes] = useState<{ mes: string; receita: number; reembolsos: number }[]>([])
  const [pagamentos, setPagamentos] = useState<any[]>([])

  useEffect(() => {
    const carregar = async () => {
      const hoje = new Date()
      const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd')
      const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd')

      const [{ data: todos }, { data: recentes }] = await Promise.all([
        supabase.from('agendamentos').select('valor_reserva, status_pagamento, data').not('valor_reserva', 'is', null),
        supabase.from('agendamentos')
          .select('*, veiculo:veiculos(marca, modelo, cliente:clientes(nome))')
          .not('status_pagamento', 'eq', 'pendente')
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      const totalPago = (todos ?? []).filter(a => a.status_pagamento === 'pago').reduce((s, a) => s + (a.valor_reserva ?? 0), 0)
      const totalPendente = (todos ?? []).filter(a => a.status_pagamento === 'pendente').reduce((s, a) => s + (a.valor_reserva ?? 0), 0)
      const totalReembolsado = (todos ?? []).filter(a => a.status_pagamento === 'reembolsado').reduce((s, a) => s + (a.valor_reserva ?? 0), 0)
      const qtdPago = (todos ?? []).filter(a => a.status_pagamento === 'pago').length

      setResumo({ totalPago, totalPendente, totalReembolsado, qtdPago })

      // Agrupar por mês (últimos 6 meses)
      const meses = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(hoje, 5 - i)
        const ini = format(startOfMonth(d), 'yyyy-MM-dd')
        const fim = format(endOfMonth(d), 'yyyy-MM-dd')
        const rec = (todos ?? []).filter(a => a.status_pagamento === 'pago' && a.data >= ini && a.data <= fim)
          .reduce((s, a) => s + (a.valor_reserva ?? 0), 0)
        const reimb = (todos ?? []).filter(a => a.status_pagamento === 'reembolsado' && a.data >= ini && a.data <= fim)
          .reduce((s, a) => s + (a.valor_reserva ?? 0), 0)
        return { mes: format(d, 'MMM', { locale: ptBR }), receita: rec, reembolsos: reimb }
      })
      setPorMes(meses)
      setPagamentos(recentes ?? [])
      setLoading(false)
    }
    carregar()
  }, [])

  const cards = [
    { label: 'Receita Total (Reservas)', value: `R$ ${resumo.totalPago.toFixed(2)}`, icon: DollarSign, color: 'text-green-400', sub: `${resumo.qtdPago} pagamentos confirmados` },
    { label: 'Reservas Pendentes', value: `R$ ${resumo.totalPendente.toFixed(2)}`, icon: TrendingUp, color: 'text-yellow-400', sub: 'aguardando pagamento' },
    { label: 'Reembolsos', value: `R$ ${resumo.totalReembolsado.toFixed(2)}`, icon: TrendingDown, color: 'text-red-400', sub: 'cancelamentos reembolsados' },
    { label: 'Ticket Médio', value: resumo.qtdPago > 0 ? `R$ ${(resumo.totalPago / resumo.qtdPago).toFixed(2)}` : 'R$ 0,00', icon: CheckCircle, color: 'text-[#C9A84C]', sub: 'por reserva paga' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Financeiro</h1>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#666] text-xs font-semibold uppercase tracking-wider">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[#666] text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico receita por mês */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4">Receita vs Reembolsos — últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={porMes}>
            <XAxis dataKey="mes" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
            <Bar dataKey="receita" name="Receita" fill="#C9A84C" radius={[4,4,0,0]} />
            <Bar dataKey="reembolsos" name="Reembolsos" fill="#EF4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Histórico */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-semibold text-white">Histórico de Pagamentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {['Data', 'Cliente', 'Serviço', 'Valor', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#666] font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(a => (
                <tr key={a.id} className="border-b border-[#2A2A2A] hover:bg-[#111] transition">
                  <td className="px-4 py-3 text-[#C9A84C] text-xs">{format(parseISO(a.data), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3 text-white">{a.veiculo?.cliente?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-[#AAA]">{a.servico}</td>
                  <td className="px-4 py-3 text-white font-medium">R$ {Number(a.valor_reserva ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      a.status_pagamento === 'pago' ? 'bg-green-900/40 text-green-400' :
                      a.status_pagamento === 'reembolsado' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-red-900/40 text-red-400'
                    }`}>{a.status_pagamento}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
