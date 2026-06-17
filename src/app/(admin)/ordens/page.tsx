'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Printer, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    supabase
      .from('agendamentos')
      .select('*, veiculo:veiculos(marca, modelo, placa, ano, cliente:clientes(nome, telefone))')
      .not('status', 'eq', 'cancelado')
      .order('data', { ascending: false })
      .then(({ data }) => { setOrdens(data ?? []); setLoading(false) })
  }, [])

  const filtrados = ordens.filter(o =>
    o.veiculo?.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    o.veiculo?.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    o.servico?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar OS..."
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#C9A84C] w-64" />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-[#666]">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-[#666]">Nenhuma ordem encontrada</div>
        ) : filtrados.map((o, idx) => (
          <div key={o.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#C9A84C]/30 transition">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#666] text-xs font-mono">OS-{String(idx + 1).padStart(4, '0')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    o.status === 'concluido' ? 'bg-green-900/40 text-green-400' :
                    o.status === 'em_andamento' ? 'bg-blue-900/40 text-blue-400' :
                    'bg-yellow-900/40 text-yellow-400'
                  }`}>{o.status?.replace('_', ' ')}</span>
                </div>
                <h3 className="text-white font-bold text-lg">{o.servico}</h3>
              </div>
              <button className="flex items-center gap-1.5 text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/10 transition">
                <Printer size={13} /> Imprimir OS
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#666] text-xs mb-1">Cliente</p>
                <p className="text-white font-medium">{o.veiculo?.cliente?.nome ?? '—'}</p>
                <p className="text-[#666] text-xs">{o.veiculo?.cliente?.telefone}</p>
              </div>
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#666] text-xs mb-1">Veículo</p>
                <p className="text-white font-medium">{o.veiculo?.marca} {o.veiculo?.modelo} {o.veiculo?.ano ? `(${o.veiculo.ano})` : ''}</p>
                <p className="text-[#C9A84C] text-xs font-mono font-bold">{o.veiculo?.placa}</p>
              </div>
              <div className="bg-[#111] rounded-lg p-3">
                <p className="text-[#666] text-xs mb-1">Data / Horário</p>
                <p className="text-white font-medium">{format(parseISO(o.data), "dd 'de' MMM yyyy", { locale: ptBR })}</p>
                <p className="text-[#666] text-xs">{o.hora?.slice(0, 5)}{o.mecanico ? ` · ${o.mecanico}` : ''}</p>
              </div>
            </div>

            {o.observacoes && (
              <div className="mt-3 bg-[#111] rounded-lg p-3">
                <p className="text-[#666] text-xs mb-1">Observações</p>
                <p className="text-[#AAA] text-sm">{o.observacoes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
