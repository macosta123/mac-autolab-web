'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Search, Filter } from 'lucide-react'

const STATUS = ['todos', 'pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado']
const STATUS_LABEL: Record<string, string> = {
  pendente:             'Pendente',
  confirmado:           'Agendamento Aprovado',
  em_andamento:         'Em andamento',
  concluido:            'Concluído',
  cancelado:            'Cancelado',
  aguardando_pagamento: 'Ag. Pagamento',
}
const STATUS_STYLE: Record<string, string> = {
  aguardando_pagamento: 'bg-purple-900/40 text-purple-400',
  pendente:             'bg-yellow-900/40 text-yellow-400',
  confirmado:           'bg-green-900/40 text-green-400',
  em_andamento:         'bg-blue-900/40 text-blue-400',
  concluido:            'bg-emerald-900/40 text-emerald-400',
  cancelado:            'bg-red-900/40 text-red-400',
}
const PAG_STYLE: Record<string, string> = {
  pendente:    'bg-yellow-900/30 text-yellow-500',
  pago:        'bg-green-900/30 text-green-400',
  reembolsado: 'bg-blue-900/30 text-blue-400',
  cancelado:   'bg-red-900/30 text-red-400',
}

export default function AgendamentosPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    setLoading(true)
    let q = supabase
      .from('agendamentos')
      .select('*, veiculo:veiculos(marca, modelo, placa, cliente:clientes(nome, telefone))')
      .order('data', { ascending: false })
      .order('hora', { ascending: false })

    if (filtro !== 'todos') q = q.eq('status', filtro)

    const { data } = await q
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [filtro])

  const atualizar = async (id: string, status: string) => {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregar()
  }

  const filtrados = items.filter(a =>
    a.servico?.toLowerCase().includes(busca.toLowerCase()) ||
    a.veiculo?.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#C9A84C] w-48"
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {STATUS.map(s => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filtro === s ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-[#AAA] border border-[#2A2A2A] hover:border-[#C9A84C]'
            }`}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABEL[s] ?? s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {['Data/Hora', 'Cliente', 'Veículo', 'Serviço', 'Status', 'Pagamento', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#666] font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#666]">Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#666]">Nenhum agendamento encontrado</td></tr>
              ) : filtrados.map(a => (
                <tr key={a.id} className="border-b border-[#2A2A2A] hover:bg-[#111] transition">
                  <td className="px-4 py-3">
                    <p className="text-[#C9A84C] font-medium">{format(parseISO(a.data), 'dd/MM/yyyy')}</p>
                    <p className="text-[#666] text-xs">{a.hora?.slice(0,5)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{a.veiculo?.cliente?.nome ?? '—'}</p>
                    <p className="text-[#666] text-xs">{a.veiculo?.cliente?.telefone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{a.veiculo?.marca} {a.veiculo?.modelo}</p>
                    <p className="text-[#C9A84C] text-xs font-mono">{a.veiculo?.placa}</p>
                  </td>
                  <td className="px-4 py-3 text-white">{a.servico}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={e => atualizar(a.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg font-semibold border-0 cursor-pointer ${STATUS_STYLE[a.status] ?? 'bg-zinc-800 text-zinc-400'}`}
                    >
                      {['pendente','confirmado','em_andamento','concluido','cancelado'].map(s => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PAG_STYLE[a.status_pagamento ?? 'pendente']}`}>
                      {a.status_pagamento ?? 'pendente'}
                    </span>
                    {a.valor_reserva && (
                      <p className="text-[#666] text-xs mt-0.5">R$ {Number(a.valor_reserva).toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-[#C9A84C] hover:underline">Ver OS</button>
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
