'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Printer, Search, X, Trash2, ChevronDown, Send, Eye, EyeOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── tipos ───────────────────────────────────────────────────────────────────
type TipoOS = 'simples' | 'completa' | 'orcamento'
type StatusOS = 'rascunho' | 'aprovado' | 'reprovado' | 'em_andamento' | 'concluido' | 'cancelado'

type ItemOS = {
  descricao: string
  tipo_item: 'servico' | 'peca'
  quantidade: number
  valor_unitario: number
}

type OrdemServico = {
  id: string
  numero_os: number
  agendamento_id: string | null
  tipo: TipoOS
  status: StatusOS
  itens: ItemOS[]
  desconto: number
  observacoes: string | null
  observacoes_internas: string | null
  visivel_cliente: boolean
  created_at: string
  agendamento?: {
    data: string
    hora: string
    servico: string
    mecanico: string | null
    veiculo: {
      marca: string; modelo: string; placa: string; ano: number | null
      cliente: { nome: string; telefone: string }
    }
  }
}

type Agendamento = {
  id: string; data: string; hora: string; servico: string; mecanico: string | null
  veiculo: { marca: string; modelo: string; placa: string; cliente: { nome: string } }
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<TipoOS, string> = { simples: 'OS Simples', completa: 'OS Completa', orcamento: 'Orçamento' }
const TIPO_COLOR: Record<TipoOS, string> = {
  simples:   'bg-blue-900/40 text-blue-400 border-blue-800',
  completa:  'bg-purple-900/40 text-purple-400 border-purple-800',
  orcamento: 'bg-amber-900/40 text-amber-400 border-amber-800',
}
const STATUS_LABEL: Record<StatusOS, string> = {
  rascunho: 'Orçamento', aprovado: 'Aprovado', reprovado: 'Reprovado',
  em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado',
}
const STATUS_COLOR: Record<StatusOS, string> = {
  rascunho:     'bg-zinc-800 text-zinc-400',
  aprovado:     'bg-green-900/40 text-green-400',
  reprovado:    'bg-red-900/40 text-red-400',
  em_andamento: 'bg-blue-900/40 text-blue-400',
  concluido:    'bg-emerald-900/40 text-emerald-400',
  cancelado:    'bg-red-900/40 text-red-500',
}

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function calcTotal(itens: ItemOS[], desconto: number) {
  const sub = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
  return Math.max(0, sub - desconto)
}

// ─── item vazio ──────────────────────────────────────────────────────────────
const itemVazio = (): ItemOS => ({ descricao: '', tipo_item: 'servico', quantidade: 1, valor_unitario: 0 })

// ─── componente de impressão ─────────────────────────────────────────────────
function PrintView({ os }: { os: OrdemServico }) {
  const sub = os.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
  const total = Math.max(0, sub - os.desconto)
  const ag = os.agendamento

  return (
    <div id="print-area" className="hidden print:block bg-white text-black p-8 font-sans text-sm">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-widest">MAC AUTO LAB</h1>
          <p className="text-xs text-gray-500">Precisão • Tecnologia • Confiança</p>
          <p className="text-xs text-gray-500">WhatsApp: (21) 99247-9502</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{TIPO_LABEL[os.tipo]}</p>
          <p className="text-xs text-gray-500">Nº OS-{String(os.numero_os).padStart(4, '0')}</p>
          <p className="text-xs text-gray-500">{format(parseISO(os.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Dados do agendamento (OS completa e orçamento) */}
      {os.tipo !== 'simples' && ag && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 border border-gray-300 rounded">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Cliente</p>
            <p className="font-semibold">{ag.veiculo?.cliente?.nome}</p>
            <p className="text-xs text-gray-500">{ag.veiculo?.cliente?.telefone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Veículo</p>
            <p className="font-semibold">{ag.veiculo?.marca} {ag.veiculo?.modelo} {ag.veiculo?.ano ? `(${ag.veiculo.ano})` : ''}</p>
            <p className="text-xs font-mono font-bold">{ag.veiculo?.placa}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Data / Hora</p>
            <p>{format(parseISO(ag.data), "dd 'de' MMMM yyyy", { locale: ptBR })} às {ag.hora?.slice(0, 5)}</p>
          </div>
          {ag.mecanico && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Mecânico</p>
              <p>{ag.mecanico}</p>
            </div>
          )}
        </div>
      )}

      {/* Itens */}
      <table className="w-full mb-4 border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 text-xs uppercase">Descrição</th>
            <th className="text-center py-2 text-xs uppercase w-16">Tipo</th>
            <th className="text-center py-2 text-xs uppercase w-16">Qtd</th>
            <th className="text-right py-2 text-xs uppercase w-24">Unit.</th>
            <th className="text-right py-2 text-xs uppercase w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {os.itens.map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-2">{item.descricao}</td>
              <td className="py-2 text-center text-xs capitalize text-gray-500">{item.tipo_item === 'servico' ? 'Serviço' : 'Peça'}</td>
              <td className="py-2 text-center">{item.quantidade}</td>
              <td className="py-2 text-right">{fmtMoeda(item.valor_unitario)}</td>
              <td className="py-2 text-right font-semibold">{fmtMoeda(item.quantidade * item.valor_unitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="flex justify-end mb-4">
        <div className="w-48">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmtMoeda(sub)}</span>
          </div>
          {os.desconto > 0 && (
            <div className="flex justify-between py-1 text-sm text-green-700">
              <span>Desconto</span>
              <span>- {fmtMoeda(os.desconto)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-base font-bold border-t-2 border-black">
            <span>Total</span>
            <span>{fmtMoeda(total)}</span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {os.observacoes && (
        <div className="border border-gray-300 rounded p-3 mb-4">
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Observações</p>
          <p className="text-sm">{os.observacoes}</p>
        </div>
      )}

      {/* Assinatura */}
      <div className="flex justify-between mt-12 pt-4 border-t border-gray-300">
        <div className="text-center w-48">
          <div className="border-t border-black mt-8 pt-1 text-xs text-gray-500">Responsável Técnico</div>
        </div>
        <div className="text-center w-48">
          <div className="border-t border-black mt-8 pt-1 text-xs text-gray-500">Cliente</div>
        </div>
      </div>
    </div>
  )
}

// ─── formulário lateral ───────────────────────────────────────────────────────
function FormularioOS({
  os, agendamentos, onSalvo, onFechar,
}: {
  os: Partial<OrdemServico> | null
  agendamentos: Agendamento[]
  onSalvo: () => void
  onFechar: () => void
}) {
  const editando = !!os?.id
  const [tipo, setTipo] = useState<TipoOS>(os?.tipo ?? 'simples')
  const [status, setStatus] = useState<StatusOS>(os?.status ?? 'rascunho')
  const [agId, setAgId] = useState<string>(os?.agendamento_id ?? '')
  const [itens, setItens] = useState<ItemOS[]>(os?.itens?.length ? os.itens : [itemVazio()])
  const [desconto, setDesconto] = useState(String(os?.desconto ?? 0))
  const [obs, setObs] = useState(os?.observacoes ?? '')
  const [obsInt, setObsInt] = useState(os?.observacoes_internas ?? '')
  const [visivel, setVisivel] = useState(os?.visivel_cliente ?? false)
  const [salvando, setSalvando] = useState(false)

  const sub = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
  const total = Math.max(0, sub - (parseFloat(desconto) || 0))

  const setItem = (idx: number, campo: keyof ItemOS, valor: any) =>
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: valor } : it))

  const removerItem = (idx: number) =>
    setItens(prev => prev.filter((_, i) => i !== idx))

  const salvar = async () => {
    if (itens.some(i => !i.descricao.trim())) {
      alert('Preencha a descrição de todos os itens.')
      return
    }
    setSalvando(true)
    const payload = {
      tipo, status, agendamento_id: agId || null,
      itens: itens.map(i => ({ ...i, quantidade: Number(i.quantidade), valor_unitario: Number(i.valor_unitario) })),
      desconto: parseFloat(desconto) || 0,
      observacoes: obs.trim() || null,
      observacoes_internas: obsInt.trim() || null,
      visivel_cliente: tipo === 'orcamento' ? visivel : false,
    }

    if (editando) {
      await supabase.from('ordens_servico').update(payload).eq('id', os!.id!)
    } else {
      await supabase.from('ordens_servico').insert(payload)
    }
    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#111] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
        <h2 className="text-white font-bold text-lg">
          {editando ? `Editar OS-${String(os!.numero_os).padStart(4, '0')}` : 'Nova Ordem de Serviço'}
        </h2>
        <button onClick={onFechar} className="text-[#666] hover:text-white transition">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Tipo */}
        <div>
          <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider block mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {(['simples', 'completa', 'orcamento'] as TipoOS[]).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`py-2 rounded-lg text-sm font-semibold border transition ${
                  tipo === t
                    ? 'bg-[#C9A84C] text-[#0D0D0D] border-[#C9A84C]'
                    : 'bg-[#1A1A1A] text-[#AAA] border-[#2A2A2A] hover:border-[#C9A84C]/40'
                }`}
              >
                {TIPO_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Agendamento vinculado */}
        <div>
          <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider block mb-2">
            Agendamento vinculado {tipo === 'simples' ? '(opcional)' : '*'}
          </label>
          <div className="relative">
            <select
              value={agId}
              onChange={e => setAgId(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C] appearance-none"
            >
              <option value="">— Nenhum —</option>
              {agendamentos.map(a => (
                <option key={a.id} value={a.id}>
                  {format(parseISO(a.data + 'T12:00:00'), 'dd/MM/yy')} · {a.veiculo?.cliente?.nome} · {a.veiculo?.placa} · {a.servico}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider block mb-2">Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as StatusOS)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C] appearance-none"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
          </div>
        </div>

        {/* Itens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider">Serviços e Peças</label>
            <button
              onClick={() => setItens(p => [...p, itemVazio()])}
              className="text-xs text-[#C9A84C] hover:text-[#E8C97A] flex items-center gap-1 transition"
            >
              <Plus size={13} /> Adicionar item
            </button>
          </div>

          <div className="space-y-2">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-[1fr_80px_60px_90px_32px] gap-2 text-xs text-[#666] uppercase px-1">
              <span>Descrição</span><span className="text-center">Tipo</span>
              <span className="text-center">Qtd</span><span className="text-right">R$ Unit.</span><span />
            </div>

            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_60px_90px_32px] gap-2 items-center">
                <input
                  value={item.descricao}
                  onChange={e => setItem(idx, 'descricao', e.target.value)}
                  placeholder="Descrição..."
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#C9A84C]"
                />
                <select
                  value={item.tipo_item}
                  onChange={e => setItem(idx, 'tipo_item', e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#C9A84C]"
                >
                  <option value="servico">Serviço</option>
                  <option value="peca">Peça</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantidade}
                  onChange={e => setItem(idx, 'quantidade', e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-[#C9A84C]"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.valor_unitario}
                  onChange={e => setItem(idx, 'valor_unitario', e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-2 text-sm text-white text-right focus:outline-none focus:border-[#C9A84C]"
                />
                <button
                  onClick={() => removerItem(idx)}
                  disabled={itens.length === 1}
                  className="text-[#444] hover:text-red-400 transition disabled:opacity-20"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totalizador */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 space-y-2">
          <div className="flex justify-between text-sm text-[#AAA]">
            <span>Subtotal</span>
            <span>{fmtMoeda(sub)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#AAA] flex-1">Desconto (R$)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={desconto}
              onChange={e => setDesconto(e.target.value)}
              className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-sm text-white text-right w-28 focus:outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div className="flex justify-between text-base font-bold text-white border-t border-[#2A2A2A] pt-2">
            <span>Total</span>
            <span className="text-[#C9A84C]">{fmtMoeda(total)}</span>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider block mb-2">
            Observações (visível ao cliente)
          </label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            rows={2}
            placeholder="Recomendações, garantia, prazo de entrega..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#C9A84C] resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-[#AAA] font-semibold uppercase tracking-wider block mb-2">
            Notas internas (só admin)
          </label>
          <textarea
            value={obsInt}
            onChange={e => setObsInt(e.target.value)}
            rows={2}
            placeholder="Fornecedor da peça, custo real, observações técnicas..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#C9A84C] resize-none"
          />
        </div>

        {/* Visível ao cliente (só orçamento) */}
        {tipo === 'orcamento' && (
          <button
            onClick={() => setVisivel(v => !v)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition ${
              visivel
                ? 'bg-green-900/30 border-green-700 text-green-400'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#AAA]'
            }`}
          >
            {visivel ? <Eye size={16} /> : <EyeOff size={16} />}
            {visivel ? 'Visível no app do cliente' : 'Não enviado ao cliente'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#2A2A2A] flex gap-3">
        <button onClick={onFechar} className="flex-1 py-3 rounded-xl text-sm text-[#AAA] border border-[#2A2A2A] hover:bg-[#1A1A1A] transition">
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex-2 flex-1 py-3 rounded-xl text-sm font-bold bg-[#C9A84C] text-[#0D0D0D] hover:bg-[#E8C97A] transition disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar OS'}
        </button>
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────
export default function OrdensPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoOS | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | ''>('')
  const [formAberto, setFormAberto] = useState(false)
  const [osEditando, setOsEditando] = useState<Partial<OrdemServico> | null>(null)
  const [imprimindo, setImprimindo] = useState<OrdemServico | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const carregar = async () => {
    setLoading(true)
    const [{ data: os }, { data: ag }] = await Promise.all([
      supabase
        .from('ordens_servico')
        .select('*, agendamento:agendamentos(data, hora, servico, mecanico, veiculo:veiculos(marca, modelo, placa, ano, cliente:clientes(nome, telefone)))')
        .order('numero_os', { ascending: false }),
      supabase
        .from('agendamentos')
        .select('id, data, hora, servico, mecanico, veiculo:veiculos(marca, modelo, placa, cliente:clientes(nome))')
        .not('status', 'eq', 'cancelado')
        .order('data', { ascending: false })
        .limit(200),
    ])
    setOrdens((os ?? []) as OrdemServico[])
    setAgendamentos((ag ?? []) as unknown as Agendamento[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const filtradas = ordens.filter(o => {
    if (filtroTipo && o.tipo !== filtroTipo) return false
    if (filtroStatus && o.status !== filtroStatus) return false
    const q = busca.toLowerCase()
    if (!q) return true
    return (
      o.agendamento?.veiculo?.cliente?.nome?.toLowerCase().includes(q) ||
      o.agendamento?.veiculo?.placa?.toLowerCase().includes(q) ||
      o.agendamento?.servico?.toLowerCase().includes(q) ||
      String(o.numero_os).includes(q)
    )
  })

  const handleImprimir = (os: OrdemServico) => {
    setImprimindo(os)
    setTimeout(() => window.print(), 300)
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir esta OS?')) return
    await supabase.from('ordens_servico').delete().eq('id', id)
    carregar()
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
        <button
          onClick={() => { setOsEditando(null); setFormAberto(true) }}
          className="flex items-center gap-2 bg-[#C9A84C] text-[#0D0D0D] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#E8C97A] transition"
        >
          <Plus size={16} /> Nova OS
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#C9A84C] w-52"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as any)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value as any)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-[#666]">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-[#666]">
          {ordens.length === 0 ? 'Nenhuma OS criada ainda.' : 'Nenhum resultado.'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtradas.map(os => {
            const total = calcTotal(os.itens, os.desconto)
            const ag = os.agendamento
            return (
              <div key={os.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#C9A84C]/20 transition">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  {/* Info principal */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#666] text-xs font-mono">
                      OS-{String(os.numero_os).padStart(4, '0')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${TIPO_COLOR[os.tipo]}`}>
                      {TIPO_LABEL[os.tipo]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[os.status]}`}>
                      {STATUS_LABEL[os.status]}
                    </span>
                    {os.tipo === 'orcamento' && os.visivel_cliente && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 flex items-center gap-1">
                        <Eye size={10} /> No app
                      </span>
                    )}
                  </div>
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImprimir(os)}
                      className="flex items-center gap-1.5 text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/10 transition"
                    >
                      <Printer size={13} /> Imprimir
                    </button>
                    <button
                      onClick={() => { setOsEditando(os); setFormAberto(true) }}
                      className="text-xs text-[#AAA] border border-[#2A2A2A] px-3 py-1.5 rounded-lg hover:bg-[#222] transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(os.id)}
                      className="text-[#444] hover:text-red-400 transition p-1.5"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Dados do agendamento */}
                {ag && (
                  <div className="grid sm:grid-cols-3 gap-2 mb-3">
                    {os.tipo !== 'simples' && (
                      <div className="bg-[#111] rounded-lg p-3">
                        <p className="text-[#666] text-xs mb-0.5">Cliente</p>
                        <p className="text-white text-sm font-medium">{ag.veiculo?.cliente?.nome ?? '—'}</p>
                        <p className="text-[#666] text-xs">{ag.veiculo?.cliente?.telefone}</p>
                      </div>
                    )}
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-[#666] text-xs mb-0.5">Veículo</p>
                      <p className="text-white text-sm font-medium">{ag.veiculo?.marca} {ag.veiculo?.modelo}</p>
                      <p className="text-[#C9A84C] text-xs font-mono font-bold">{ag.veiculo?.placa}</p>
                    </div>
                    <div className="bg-[#111] rounded-lg p-3">
                      <p className="text-[#666] text-xs mb-0.5">Data</p>
                      <p className="text-white text-sm font-medium">
                        {format(parseISO(ag.data + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })} às {ag.hora?.slice(0, 5)}
                      </p>
                      <p className="text-[#666] text-xs">{ag.servico}</p>
                    </div>
                  </div>
                )}

                {/* Itens resumo + total */}
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1 text-xs text-[#666] space-y-0.5">
                    {os.itens.slice(0, 3).map((it, i) => (
                      <p key={i}>{it.descricao} × {it.quantidade} — {fmtMoeda(it.quantidade * it.valor_unitario)}</p>
                    ))}
                    {os.itens.length > 3 && <p>+{os.itens.length - 3} item(ns)...</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {os.desconto > 0 && (
                      <p className="text-xs text-green-400">- {fmtMoeda(os.desconto)} desc.</p>
                    )}
                    <p className="text-lg font-bold text-[#C9A84C]">{fmtMoeda(total)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulário lateral */}
      {formAberto && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFormAberto(false)} />
          <FormularioOS
            os={osEditando}
            agendamentos={agendamentos}
            onSalvo={() => { setFormAberto(false); carregar() }}
            onFechar={() => setFormAberto(false)}
          />
        </>
      )}

      {/* Área de impressão */}
      {imprimindo && <PrintView os={imprimindo} />}

      {/* CSS de impressão */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-area { display: block !important; }
        }
      `}</style>
    </div>
  )
}
