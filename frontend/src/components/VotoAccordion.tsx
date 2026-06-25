'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { posturaCor } from '@/lib/postura'
import type { PerfilParlamentar, Postura } from '@/types'

interface VotoDetalhe {
  ementa: string
  voto: string
  data: string | null
}

interface Props {
  parlamentarId: number
  perfil: PerfilParlamentar[]
}

export function VotoAccordion({ parlamentarId, perfil }: Props) {
  const [aberto, setAberto] = useState<string | null>(null)
  const [votos, setVotos] = useState<Record<string, VotoDetalhe[]>>({})
  const [carregando, setCarregando] = useState<string | null>(null)

  async function toggle(tema: string) {
    if (aberto === tema) {
      setAberto(null)
      return
    }
    setAberto(tema)
    if (votos[tema]) return // já carregado

    setCarregando(tema)
    const { data } = await supabase.rpc('votos_por_tema', {
      p_parlamentar_id: parlamentarId,
      p_tema: tema,
    })
    setVotos((prev) => ({ ...prev, [tema]: data ?? [] }))
    setCarregando(null)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {perfil.map((p) => {
        const expandido = aberto === p.tema_cidadao
        const dados = votos[p.tema_cidadao] ?? []
        const loading = carregando === p.tema_cidadao
        const c = posturaCor(p.postura_geral)

        return (
          <div key={p.tema_cidadao} className="border-t border-[#F0EDE3] first:border-t-0">
            {/* Linha clicável */}
            <button
              onClick={() => toggle(p.tema_cidadao)}
              className="grid w-full grid-cols-[1fr_200px_110px_22px] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
            >
              <div>
                <div className="text-base font-semibold">{p.tema_cidadao}</div>
                <div className="mt-0.5 text-[12.5px] text-faint">
                  {p.total_votacoes} votações analisadas
                </div>
              </div>
              <div className="h-[9px] overflow-hidden rounded-md bg-[#EFECE2]">
                <div
                  className="h-full rounded-md"
                  style={{ width: `${p.pct_favoravel}%`, background: c.barra }}
                />
              </div>
              <span className="flex justify-end">
                <span
                  className="rounded-full px-[9px] py-[3px] text-[11px] font-semibold"
                  style={{ background: c.bg, color: c.texto }}
                >
                  {c.label}
                </span>
              </span>
              <span
                className="flex justify-end text-[#B0B2A6] transition-transform duration-200"
                style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {/* Conteúdo expandido */}
            {expandido && (
              <div className="flex flex-col gap-2 px-6 pb-[18px] pt-1">
                {loading ? (
                  <p className="py-4 text-center text-sm text-faint">Carregando…</p>
                ) : dados.length === 0 ? (
                  <p className="py-2 text-sm text-faint">Sem detalhes disponíveis.</p>
                ) : (
                  dados.map((v, idx) => {
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
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
