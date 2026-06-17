'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Phone, MessageCircle, MapPin, Clock, Star, ChevronLeft, ChevronRight, Wrench, Zap, Shield, TrendingUp } from 'lucide-react'

const SERVICOS = [
  { icon: Wrench, nome: 'Mecânica Especializada', desc: 'Motor, câmbio, embreagem e muito mais com diagnóstico avançado.' },
  { icon: Zap, nome: 'Auto Elétrica & Eletrônica', desc: 'Injeção eletrônica, sensores, módulos e sistemas elétricos.' },
  { icon: Shield, nome: 'Freios & Suspensão', desc: 'Discos, pastilhas, amortecedores, alinhamento e balanceamento.' },
  { icon: TrendingUp, nome: 'Performance & Reparação', desc: 'Preparação de motor, funilaria, pintura e reparo estrutural.' },
]

type Banner = { id: string; titulo: string; descricao: string; cor_fundo: string; cor_texto: string; badge?: string }
type Preco = { id: string; nome: string; preco_venda: number; categoria: string; destaque: boolean; mostrar_site: boolean }

export default function SitePage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [precos, setPrecos] = useState<Preco[]>([])
  const [bannerAtivo, setBannerAtivo] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    supabase.from('banners').select('*').eq('ativo', true).order('ordem').then(({ data }) => setBanners(data ?? []))
    supabase.from('estoque').select('id, nome, preco_venda, categoria, destaque, mostrar_site').eq('mostrar_site', true).order('categoria').then(({ data }) => setPrecos((data as Preco[]) ?? []))
  }, [])

  // Auto-avanço do banner a cada 4s
  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => setBannerAtivo(p => (p + 1) % banners.length), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length])

  const navBanner = (dir: 1 | -1) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setBannerAtivo(p => (p + dir + banners.length) % banners.length)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur border-b border-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-black tracking-[0.3em] text-white leading-none">MAC</p>
            <div className="h-px bg-[#C9A84C] w-10 my-0.5" />
            <p className="text-[#C9A84C] text-[10px] font-bold tracking-[0.4em]">AUTO LAB</p>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#AAA]">
            <a href="#servicos" className="hover:text-[#C9A84C] transition">Serviços</a>
            <a href="#precos" className="hover:text-[#C9A84C] transition">Peças & Preços</a>
            <a href="#contato" className="hover:text-[#C9A84C] transition">Contato</a>
          </nav>
          <a href="https://wa.me/5521992479502" target="_blank"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>
      </header>

      {/* BANNERS STORY */}
      {banners.length > 0 && (
        <section className="relative overflow-hidden">
          {/* Barra de progresso */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {banners.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
                <div className={`h-full bg-[#C9A84C] transition-all duration-300 ${i === bannerAtivo ? 'animate-progress' : i < bannerAtivo ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>

          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${bannerAtivo * 100}%)` }}
          >
            {banners.map((b) => (
              <div
                key={b.id}
                className="min-w-full h-[420px] md:h-[520px] flex items-center justify-center relative"
                style={{ background: b.cor_fundo || 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)' }}
              >
                <div className="text-center px-8 max-w-2xl mx-auto">
                  {b.badge && (
                    <span className="inline-block bg-[#C9A84C] text-[#0D0D0D] text-xs font-black px-4 py-1.5 rounded-full tracking-widest mb-4">
                      {b.badge}
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4" style={{ color: b.cor_texto || '#FFFFFF' }}>
                    {b.titulo}
                  </h2>
                  <p className="text-lg md:text-xl" style={{ color: b.cor_texto ? b.cor_texto + 'CC' : '#AAAAAA' }}>
                    {b.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controles */}
          {banners.length > 1 && (
            <>
              <button onClick={() => navBanner(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => navBanner(1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition">
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setBannerAtivo(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === bannerAtivo ? 'bg-[#C9A84C] w-6' : 'bg-white/30'}`} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* HERO (quando sem banners) */}
      {banners.length === 0 && (
        <section className="py-24 px-4 text-center">
          <p className="text-[#C9A84C] text-sm font-bold tracking-widest mb-4">PRECISÃO • TECNOLOGIA • CONFIANÇA</p>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">MAC AUTO LAB</h1>
          <p className="text-[#AAA] text-lg max-w-xl mx-auto">Excelência em cada detalhe. Confiança em cada quilômetro.</p>
        </section>
      )}

      {/* SERVIÇOS */}
      <section id="servicos" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-2">O que fazemos</p>
          <h2 className="text-3xl font-black text-white">Nossos Serviços</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICOS.map(({ icon: Icon, nome, desc }) => (
            <div key={nome} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#C9A84C]/50 transition group">
              <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center mb-3 group-hover:bg-[#C9A84C]/20 transition">
                <Icon size={20} className="text-[#C9A84C]" />
              </div>
              <h3 className="text-white font-bold mb-2">{nome}</h3>
              <p className="text-[#666] text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREÇOS DE PEÇAS */}
      {precos.length > 0 && (
        <section id="precos" className="py-16 px-4 bg-[#111]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-2">Tabela de Preços</p>
              <h2 className="text-3xl font-black text-white">Peças & Produtos</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {precos.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.destaque ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#2A2A2A] bg-[#1A1A1A]'}`}>
                  <div>
                    {p.destaque && <span className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-widest">Destaque</span>}
                    <p className="text-white font-medium">{p.nome}</p>
                    <p className="text-[#666] text-xs">{p.categoria}</p>
                  </div>
                  <p className="text-[#C9A84C] font-black text-lg">R$ {Number(p.preco_venda ?? 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DEPOIMENTOS */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-2">Quem nos escolheu</p>
          <h2 className="text-3xl font-black text-white">Avaliações</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { nome: 'Carlos M.', texto: 'Serviço excelente! Diagnóstico preciso e atendimento rápido.', nota: 5 },
            { nome: 'Ana P.', texto: 'Muito profissionais. Resolveram meu carro em tempo recorde!', nota: 5 },
            { nome: 'Ricardo S.', texto: 'Preço justo e trabalho de qualidade. Recomendo muito!', nota: 5 },
          ].map(({ nome, texto, nota }) => (
            <div key={nome} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: nota }).map((_, i) => <Star key={i} size={14} className="text-[#C9A84C] fill-[#C9A84C]" />)}
              </div>
              <p className="text-[#AAA] text-sm mb-3">"{texto}"</p>
              <p className="text-white text-sm font-bold">{nome}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-16 px-4 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-2">Fale conosco</p>
          <h2 className="text-3xl font-black text-white mb-8">Entre em Contato</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Phone, label: 'Telefone', value: '(21) 99247-9502' },
              { icon: MessageCircle, label: 'Instagram', value: '@mac.autolab' },
              { icon: Clock, label: 'Horário', value: 'Seg–Sex 8h–18h' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#C9A84C]" />
                </div>
                <div className="text-left">
                  <p className="text-[#666] text-xs">{label}</p>
                  <p className="text-white font-medium text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="https://wa.me/5521992479502" target="_blank"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition">
            <MessageCircle size={20} /> Agendar pelo WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A2A] py-6 px-4 text-center">
        <p className="text-[#666] text-sm">© 2026 MAC Auto Lab · Todos os direitos reservados</p>
        <p className="text-[#C9A84C] text-xs mt-1 tracking-widest">PRECISÃO • TECNOLOGIA • CONFIANÇA</p>
      </footer>
    </div>
  )
}
