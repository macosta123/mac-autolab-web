'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Phone, Mail, Car } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<any>(null)
  const [veiculos, setVeiculos] = useState<any[]>([])

  useEffect(() => {
    supabase.from('clientes').select('*').order('nome').then(({ data }) => {
      setClientes(data ?? [])
      setLoading(false)
    })
  }, [])

  const verCliente = async (c: any) => {
    setSelecionado(c)
    const { data } = await supabase.from('veiculos').select('*').eq('cliente_id', c.id)
    setVeiculos(data ?? [])
  }

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#C9A84C] w-72"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  {['Cliente', 'Telefone', 'E-mail', 'Veículos'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#666] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-[#666]">Carregando...</td></tr>
                ) : filtrados.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => verCliente(c)}
                    className={`border-b border-[#2A2A2A] cursor-pointer transition ${selecionado?.id === c.id ? 'bg-[#C9A84C]/10' : 'hover:bg-[#111]'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#9A7A30] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.nome?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#AAA]">{c.telefone}</td>
                    <td className="px-4 py-3 text-[#666] text-xs">{c.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[#C9A84C] text-xs">
                        <Car size={12} /> ver
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhe */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          {!selecionado ? (
            <div className="flex items-center justify-center h-40 text-[#666] text-sm">
              Clique em um cliente para ver detalhes
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#9A7A30] border-2 border-[#C9A84C] flex items-center justify-center text-white font-bold text-xl">
                  {selecionado.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">{selecionado.nome}</p>
                  <p className="text-[#666] text-xs">Cliente</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#AAA]">
                  <Phone size={14} className="text-[#C9A84C]" />{selecionado.telefone}
                </div>
                {selecionado.email && (
                  <div className="flex items-center gap-2 text-[#AAA]">
                    <Mail size={14} className="text-[#C9A84C]" />{selecionado.email}
                  </div>
                )}
                {selecionado.endereco && (
                  <p className="text-[#666] text-xs">{selecionado.endereco}</p>
                )}
              </div>
              <div className="border-t border-[#2A2A2A] pt-3">
                <p className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-2">Veículos</p>
                {veiculos.length === 0 ? (
                  <p className="text-[#666] text-xs">Nenhum veículo</p>
                ) : veiculos.map(v => (
                  <div key={v.id} className="flex items-center gap-2 p-2 bg-[#111] rounded-lg mb-1.5">
                    <Car size={14} className="text-[#C9A84C]" />
                    <div>
                      <p className="text-white text-xs font-medium">{v.marca} {v.modelo}</p>
                      <p className="text-[#C9A84C] text-xs font-mono">{v.placa}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
