'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'

type Produto = {
  id: string; nome: string; categoria: string; quantidade: number;
  estoque_minimo: number; preco_custo: number; preco_venda: number; unidade: string
}

const CATEGORIAS = ['Todos', 'Óleo', 'Filtros', 'Freios', 'Suspensão', 'Elétrica', 'Pneus', 'Outros']

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [form, setForm] = useState({ nome: '', categoria: 'Óleo', quantidade: '', estoque_minimo: '5', preco_custo: '', preco_venda: '', unidade: 'un' })

  const carregar = async () => {
    const { data } = await supabase.from('estoque').select('*').order('nome')
    setProdutos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const salvar = async () => {
    const payload = {
      nome: form.nome, categoria: form.categoria,
      quantidade: Number(form.quantidade), estoque_minimo: Number(form.estoque_minimo),
      preco_custo: Number(form.preco_custo), preco_venda: Number(form.preco_venda),
      unidade: form.unidade
    }
    if (editando) await supabase.from('estoque').update(payload).eq('id', editando.id)
    else await supabase.from('estoque').insert(payload)
    setModal(false); setEditando(null)
    setForm({ nome: '', categoria: 'Óleo', quantidade: '', estoque_minimo: '5', preco_custo: '', preco_venda: '', unidade: 'un' })
    carregar()
  }

  const excluir = async (id: string) => {
    if (confirm('Excluir este produto?')) {
      await supabase.from('estoque').delete().eq('id', id)
      carregar()
    }
  }

  const abrirEditar = (p: Produto) => {
    setEditando(p)
    setForm({ nome: p.nome, categoria: p.categoria, quantidade: String(p.quantidade), estoque_minimo: String(p.estoque_minimo), preco_custo: String(p.preco_custo), preco_venda: String(p.preco_venda), unidade: p.unidade })
    setModal(true)
  }

  const filtrados = produtos.filter(p =>
    (categoria === 'Todos' || p.categoria === categoria) &&
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const baixoEstoque = produtos.filter(p => p.quantidade <= p.estoque_minimo).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Estoque</h1>
          {baixoEstoque > 0 && (
            <p className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> {baixoEstoque} produto(s) com estoque baixo
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditando(null); setModal(true) }}
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0D0D0D] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#E8C97A] transition"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..."
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#C9A84C]" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setCategoria(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${categoria === c ? 'bg-[#C9A84C] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-[#AAA] border border-[#2A2A2A]'}`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {['Produto', 'Categoria', 'Qtd', 'Mín.', 'Custo', 'Venda', 'Margem', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#666] font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#666]">Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[#666]">Nenhum produto encontrado</td></tr>
              ) : filtrados.map(p => {
                const margem = p.preco_custo > 0 ? ((p.preco_venda - p.preco_custo) / p.preco_custo * 100).toFixed(0) : '—'
                const baixo = p.quantidade <= p.estoque_minimo
                return (
                  <tr key={p.id} className="border-b border-[#2A2A2A] hover:bg-[#111] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className={baixo ? 'text-yellow-400' : 'text-[#C9A84C]'} />
                        <span className="text-white font-medium">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="bg-[#111] text-[#AAA] text-xs px-2 py-1 rounded">{p.categoria}</span></td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${baixo ? 'text-yellow-400' : 'text-white'}`}>{p.quantidade}</span>
                      <span className="text-[#666] text-xs"> {p.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-[#666]">{p.estoque_minimo}</td>
                    <td className="px-4 py-3 text-[#AAA]">R$ {Number(p.preco_custo).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#C9A84C] font-medium">R$ {Number(p.preco_venda).toFixed(2)}</td>
                    <td className="px-4 py-3 text-green-400 text-xs font-bold">{margem}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => abrirEditar(p)} className="text-[#C9A84C] hover:text-white transition"><Pencil size={14} /></button>
                        <button onClick={() => excluir(p.id)} className="text-[#666] hover:text-red-400 transition"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-white font-bold text-lg">{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
            {[
              ['Nome', 'nome', 'text'], ['Qtd em estoque', 'quantidade', 'number'],
              ['Estoque mínimo', 'estoque_minimo', 'number'], ['Preço de custo (R$)', 'preco_custo', 'number'],
              ['Preço de venda (R$)', 'preco_venda', 'number'], ['Unidade (un, L, kg)', 'unidade', 'text']
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-xs text-[#AAA] font-semibold">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]" />
              </div>
            ))}
            <div>
              <label className="text-xs text-[#AAA] font-semibold">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="mt-1 w-full bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]">
                {CATEGORIAS.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setModal(false); setEditando(null) }}
                className="flex-1 bg-[#111] border border-[#2A2A2A] text-[#AAA] py-2.5 rounded-lg text-sm hover:border-[#666] transition">
                Cancelar
              </button>
              <button onClick={salvar}
                className="flex-1 bg-[#C9A84C] text-[#0D0D0D] py-2.5 rounded-lg text-sm font-bold hover:bg-[#E8C97A] transition">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
