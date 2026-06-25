import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MetricasCard } from '@/components/MetricasCard'
import { buscarResumoTemas } from '@/lib/temas'
import { posturaDaMedia } from '@/lib/agregacao'
import { posturaCor } from '@/lib/postura'
import type { MetricasModelo } from '@/types'

export const revalidate = 3600

async function getMetricas(): Promise<MetricasModelo | null> {
  const { data } = await supabase
    .from('metricas_modelo')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

const STEPS = [
  {
    num: '01',
    title: 'Coletamos as votações',
    desc: 'Reunimos os votos nominais do Plenário pela API aberta da Câmara e agrupamos as propostas em temas do dia a dia.',
  },
  {
    num: '02',
    title: 'Calculamos a postura',
    desc: 'Para cada deputado, medimos quanto ele votou a favor em cada tema e classificamos como favorável, neutro ou contrário.',
  },
  {
    num: '03',
    title: 'Prevemos o voto',
    desc: 'Um modelo aprende com partido, estado e histórico para estimar como o parlamentar tende a votar em novas propostas.',
  },
]

export default async function HomePage() {
  const [metricas, temas] = await Promise.all([getMetricas(), buscarResumoTemas()])

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-[90px]">
      {/* Hero */}
      <section className="grid items-center gap-[54px] py-[74px] md:grid-cols-[1.15fr_.85fr]">
        <div>
          <span className="mb-[18px] inline-block text-[12.5px] font-semibold uppercase tracking-[.09em] text-fav">
            Transparência parlamentar com dados
          </span>
          <h1 className="mb-5 font-serif text-[54px] font-medium leading-[1.04] tracking-[-.02em]">
            Como cada deputado vota, tema por tema.
          </h1>
          <p className="mb-[30px] max-w-[46ch] text-[18px] leading-relaxed text-muted">
            Reunimos as votações da Câmara dos Deputados e mostramos, em linguagem clara, a
            postura de cada parlamentar em cada assunto — e usamos dados para prever como ele
            tende a votar.
          </p>
          <div className="flex gap-3">
            <Link
              href="/deputados"
              className="rounded-[11px] bg-forest px-6 py-3.5 text-[15px] font-semibold text-cream"
            >
              Explorar deputados
            </Link>
            <Link
              href="/temas"
              className="rounded-[11px] border-[1.5px] border-[#C9C5B8] px-6 py-3.5 text-[15px] font-semibold text-forest"
            >
              Explorar temas
            </Link>
          </div>
        </div>

        {/* Card exemplo de leitura — usa médias reais por tema */}
        <div className="rounded-[18px] border border-line bg-white p-6 shadow-[0_14px_40px_-22px_rgba(19,53,47,.4)]">
          <div className="mb-3.5 text-[12px] font-semibold uppercase tracking-[.06em] text-faint">
            Exemplo de leitura
          </div>
          {temas.map((t) => {
            const c = posturaCor(posturaDaMedia(t.media))
            return (
              <div key={t.slug} className="mb-3.5 last:mb-0">
                <div className="mb-[5px] flex items-baseline justify-between">
                  <span className="text-[14px] font-medium">{t.tema}</span>
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ color: c.texto }}
                  >
                    {t.media}%
                  </span>
                </div>
                <div className="h-[9px] overflow-hidden rounded-md bg-[#EFECE2]">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${t.media}%`, background: c.barra }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Como funciona */}
      <section className="pb-2.5 pt-3.5">
        <div className="mb-[26px] flex items-baseline gap-3.5">
          <h2 className="font-serif text-[30px] font-medium tracking-tight">Como funciona</h2>
          <span className="h-px flex-1 bg-[#DAD6C9]" />
        </div>
        <div className="grid gap-[18px] md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num} className="rounded-[15px] border border-line bg-white p-[26px]">
              <div className="mb-3.5 font-serif text-[34px] font-semibold leading-none text-gold">
                {s.num}
              </div>
              <h3 className="mb-2 text-[17px] font-semibold">{s.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Métricas do modelo (dados reais) */}
      {metricas && (
        <div className="mt-[42px]">
          <MetricasCard metricas={metricas} />
        </div>
      )}
    </main>
  )
}
