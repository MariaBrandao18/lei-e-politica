'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PosturaTag } from './PosturaTag'
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Cabeçalho da tabela */}
      <div className="grid grid-cols-[1fr_120px_100px_80px_24px] gap-2 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-500">
        <span>Tema</span>
        <span className="text-center">Postura</span>
        <span className="text-right">% Favorável</span>
        <span className="text-right">Votações</span>
        <span />
      </div>

      {perfil.map((p, i) => {
        const expandido = aberto === p.tema_cidadao
        const dados = votos[p.tema_cidadao] ?? []
        const loading = carregando === p.tema_cidadao

        return (
          <div key={p.tema_cidadao} className={i > 0 ? 'border-t border-gray-100' : ''}>
            {/* Linha clicável */}
            <button
              onClick={() => toggle(p.tema_cidadao)}
              className="grid w-full grid-cols-[1fr_120px_100px_80px_24px] gap-2 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-800">{p.tema_cidadao}</span>
              <span className="flex justify-center">
                <PosturaTag postura={p.postura_geral as Postura} />
              </span>
              <span className="text-right text-sm text-gray-700">
                {p.pct_favoravel.toFixed(1)}%
              </span>
              <span className="text-right text-sm text-gray-500">{p.total_votacoes}</span>
              <span className="flex items-center justify-end text-gray-400">
                <svg
                  className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {/* Conteúdo expandido */}
            {expandido && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 pb-3 pt-2">
                {loading ? (
                  <p className="py-4 text-center text-sm text-gray-400">Carregando...</p>
                ) : dados.length === 0 ? (
                  <p className="py-2 text-sm text-gray-400">Sem detalhes disponíveis.</p>
                ) : (
                  <div className="space-y-2">
                    {dados.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="mt-0.5 shrink-0">
                          <PosturaTag postura={v.voto as Postura} />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm text-gray-800">{v.ementa}</p>
                          {v.data && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {new Date(v.data).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
