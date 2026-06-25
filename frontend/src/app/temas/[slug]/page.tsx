import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buscarResumoTemas } from '@/lib/temas'
import { corAvatar, iniciais, posturaCor } from '@/lib/postura'
import type { Postura } from '@/types'

export const revalidate = 3600

export async function generateStaticParams() {
  const temas = await buscarResumoTemas()
  return temas.map((t) => ({ slug: t.slug }))
}

interface LinhaRanking {
  pct_favoravel: number
  total_votacoes: number
  postura_geral: Postura
  parlamentares: { id: number; nome: string; partido: string; uf: string } | null
}

function medalha(rank: number): string {
  if (rank === 1) return '#C99A2E'
  if (rank === 2) return '#9AA0A6'
  if (rank === 3) return '#B5742E'
  return '#C2C0B6'
}

export default async function TemaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Resolve o nome real do tema a partir do slug
  const temas = await buscarResumoTemas()
  const resumo = temas.find((t) => t.slug === slug)
  if (!resumo) notFound()

  const { data } = await supabase
    .from('perfil_parlamentar')
    .select('pct_favoravel, total_votacoes, postura_geral, parlamentares(id, nome, partido, uf)')
    .eq('tema_cidadao', resumo.tema)
    .order('pct_favoravel', { ascending: false })

  const ranking = (data ?? []) as unknown as LinhaRanking[]

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-[90px] pt-[34px]">
      <div className="mb-6 flex justify-center">
        <Link
          href="/temas"
          className="inline-flex items-center gap-2.5 rounded-[30px] border-[1.5px] border-[#C9C5B8] bg-white px-6 py-2.5 text-[14.5px] font-semibold text-forest shadow-[0_3px_10px_-5px_rgba(19,53,47,.35)] transition-colors hover:border-forest hover:bg-forest hover:text-white"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Todos os temas
        </Link>
      </div>

      <h1 className="mb-1.5 text-center font-serif text-[38px] font-medium tracking-[-.015em]">
        {resumo.tema}
      </h1>
      <p className="mx-auto mb-[26px] max-w-[58ch] text-center text-[16px] text-muted">
        Deputados ordenados de quem mais votou a favor a quem mais votou contra este tema.
      </p>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {/* Cabeçalho do tema */}
        <div className="flex items-center justify-between border-b border-[#EDEAE0] bg-surface px-6 py-5">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[.07em] text-faint">
              Categoria
            </div>
            <div className="mt-0.5 font-serif text-[23px] font-semibold">{resumo.tema}</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-faint">Média favorável</div>
            <div className="text-[21px] font-bold tabular-nums text-fav">{resumo.media}%</div>
          </div>
        </div>

        {ranking.map((r, i) => {
          const dep = r.parlamentares
          if (!dep) return null
          const c = posturaCor(r.postura_geral)
          const pct = Math.round(Number(r.pct_favoravel))
          return (
            <Link
              key={dep.id}
              href={`/deputados/${dep.id}?from=/temas/${slug}`}
              className="grid grid-cols-[38px_46px_1fr_150px_64px] items-center gap-3.5 border-t border-[#F0EDE3] px-6 py-3.5 transition-colors hover:bg-surface"
            >
              <span
                className="font-serif text-[20px] font-semibold tabular-nums"
                style={{ color: medalha(i + 1) }}
              >
                {i + 1}
              </span>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold text-white"
                style={{ background: corAvatar(dep.id) }}
              >
                {iniciais(dep.nome)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{dep.nome}</div>
                <div className="text-[12.5px] text-[#7A7D70]">
                  {dep.partido} · {dep.uf}
                </div>
              </div>
              <div className="h-[9px] overflow-hidden rounded-md bg-[#EFECE2]">
                <div className="h-full rounded-md" style={{ width: `${pct}%`, background: c.barra }} />
              </div>
              <span
                className="text-right text-[16px] font-bold tabular-nums"
                style={{ color: c.barra }}
              >
                {pct}%
              </span>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
