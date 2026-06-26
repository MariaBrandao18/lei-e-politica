import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { VotoAccordion } from '@/components/VotoAccordion'
import { posturaCor } from '@/lib/postura'
import { AvatarFoto } from '@/components/AvatarFoto'
import { resumoDeputado } from '@/lib/agregacao'
import type { Parlamentar, PerfilParlamentar } from '@/types'

export const revalidate = 3600

export async function generateStaticParams() {
  const { data } = await supabase.from('parlamentares').select('id').eq('casa', 'camara')
  return (data ?? []).map((p) => ({ id: String(p.id) }))
}

async function getDeputado(id: number): Promise<Parlamentar | null> {
  const { data } = await supabase.from('parlamentares').select('*').eq('id', id).single()
  return data
}

async function getPerfil(parlamentarId: number): Promise<PerfilParlamentar[]> {
  const { data } = await supabase
    .from('perfil_parlamentar')
    .select('tema_cidadao, pct_favoravel, total_votacoes, postura_geral')
    .eq('parlamentar_id', parlamentarId)
    .order('pct_favoravel', { ascending: false })
  return data ?? []
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function DeputadoPage({ params, searchParams }: PageProps) {
  const { id: idStr } = await params
  const { from } = await searchParams
  const id = Number(idStr)
  if (isNaN(id)) notFound()

  const [deputado, perfil] = await Promise.all([getDeputado(id), getPerfil(id)])
  if (!deputado) notFound()

  const r = resumoDeputado(perfil)
  const geral = r.posturaGeral ? posturaCor(r.posturaGeral) : null

  // Botão voltar: se veio de um tema, volta para o ranking daquele tema
  const voltaParaTema = from?.startsWith('/temas/')
  const voltarHref = voltaParaTema ? from! : '/deputados'
  const voltarLabel = voltaParaTema ? 'Voltar ao tema' : 'Todos os deputados'

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-[90px] pt-[34px]">
      <div className="mb-6">
        <Link
          href={voltarHref}
          className="inline-flex items-center gap-2.5 rounded-[30px] border-[1.5px] border-[#C9C5B8] bg-white px-5 py-2.5 text-[13px] font-semibold text-forest shadow-[0_3px_10px_-5px_rgba(19,53,47,.35)] transition-colors hover:border-forest hover:bg-forest hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {voltarLabel}
        </Link>
      </div>

      {/* Cabeçalho do deputado */}
      <div className="mb-3.5 flex items-center gap-[22px] rounded-[18px] border border-line bg-white p-7">
        <AvatarFoto
          nome={deputado.nome}
          id={deputado.id}
          fotoUrl={deputado.foto_url}
          size={88}
          fontSize="30px"
        />
        <div className="flex-1">
          <h1 className="font-serif text-[32px] font-medium tracking-[-.015em]">
            {deputado.nome}
          </h1>
          <p className="mt-1.5 text-[15px] text-[#7A7D70]">
            {deputado.partido} · {deputado.uf}
          </p>
        </div>
        {geral && (
          <div className="border-l border-[#EDEAE0] pl-5 text-right">
            <div className="text-[12px] uppercase tracking-[.05em] text-faint">Postura geral</div>
            <div className="mt-1 text-[26px] font-bold" style={{ color: geral.texto }}>
              {geral.label}
            </div>
            <div className="text-[13px] tabular-nums text-faint">
              {r.media}% favorável na média
            </div>
          </div>
        )}
      </div>

      {perfil.length === 0 ? (
        <p className="py-10 text-center text-muted">
          Sem dados suficientes de votação (mínimo 3 votos por tema).
        </p>
      ) : (
        <>
          {/* Legenda */}
          <div className="my-4 flex items-center gap-2 px-0.5 text-[13px] text-[#7A7D70]">
            <Legenda cor="#1F7A5C" texto="Favorável" />
            <Legenda cor="#D7B45A" texto="Neutro" />
            <Legenda cor="#BE4A2F" texto="Contrário" />
            <span className="ml-auto">Toque num tema para ver as propostas votadas.</span>
          </div>

          <VotoAccordion parlamentarId={id} perfil={perfil} />
        </>
      )}
    </main>
  )
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-[11px] w-[11px] rounded-[3px]" style={{ background: cor }} />
      {texto}
    </span>
  )
}
