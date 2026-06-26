'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { posturaCor } from '@/lib/postura'
import { AvatarFoto } from '@/components/AvatarFoto'
import type { Postura } from '@/types'

interface VotoDetalhe {
  ementa: string
  voto: string
  data: string | null
}

interface Props {
  rank: number
  pct: number
  postura: Postura
  dep: { id: number; nome: string; partido: string; uf: string; foto_url: string | null }
  tema: string
  slug: string
  medalhaColor: string
}

export function RankingDeputado({ rank, pct, postura, dep, tema, slug, medalhaColor }: Props) {
  const [aberto, setAberto] = useState(false)
  const [votos, setVotos] = useState<VotoDetalhe[] | null>(null)
  const [carregando, setCarregando] = useState(false)

  const c = posturaCor(postura)

  async function toggle() {
    if (aberto) { setAberto(false); return }
    setAberto(true)
    if (votos !== null) return
    setCarregando(true)
    const { data } = await supabase.rpc('votos_por_tema', {
      p_parlamentar_id: dep.id,
      p_tema: tema,
    })
    setVotos(data ?? [])
    setCarregando(false)
  }

  return (
    <div className="border-t border-[#F0EDE3]">
      <button
        onClick={toggle}
        className="grid w-full grid-cols-[38px_46px_1fr_150px_64px_22px] items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-surface"
      >
        <span
          className="font-serif text-[20px] font-semibold tabular-nums"
          style={{ color: medalhaColor }}
        >
          {rank}
        </span>

        <AvatarFoto nome={dep.nome} id={dep.id} fotoUrl={dep.foto_url} size={40} fontSize="14px" />

        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{dep.nome}</div>
          <div className="text-[12.5px] text-[#7A7D70]">{dep.partido} · {dep.uf}</div>
        </div>

        <div className="h-[9px] overflow-hidden rounded-md bg-[#EFECE2]">
          <div className="h-full rounded-md" style={{ width: `${pct}%`, background: c.barra }} />
        </div>

        <span className="text-right text-[16px] font-bold tabular-nums" style={{ color: c.barra }}>
          {pct}%
        </span>

        <span
          className="flex justify-end text-[#B0B2A6] transition-transform duration-200"
          style={{ transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {aberto && (
        <div className="px-6 pb-5 pt-1">
          {carregando ? (
            <p className="py-4 text-center text-sm text-faint">Carregando…</p>
          ) : !votos || votos.length === 0 ? (
            <p className="py-2 text-sm text-faint">Sem votações nominais registradas para este tema.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {votos.map((v, idx) => {
                const favoravel = v.voto === 'favoravel'
                const vc = posturaCor((favoravel ? 'favoravel' : 'contrario') as Postura)
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-[11px] border border-[#EDEAE0] bg-surface px-3.5 py-3"
                  >
                    <span
                      className="mt-px whitespace-nowrap rounded-md px-2 py-[3px] text-[10.5px] font-bold"
                      style={{ background: vc.bg, color: vc.texto }}
                    >
                      {favoravel ? 'Votou SIM' : 'Votou NÃO'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] leading-relaxed text-[#33362E]">{v.ementa}</p>
                      {v.data && (
                        <p className="mt-1 text-[11.5px] text-faint">
                          {new Date(v.data).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              <Link
                href={`/deputados/${dep.id}?from=/temas/${slug}`}
                className="mt-1 inline-flex items-center gap-1 self-start text-[12.5px] font-semibold text-forest hover:underline"
              >
                Ver perfil completo
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
