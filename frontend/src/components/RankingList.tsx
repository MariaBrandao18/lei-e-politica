'use client'

import { useState } from 'react'
import { RankingDeputado } from '@/components/RankingDeputado'
import type { Postura } from '@/types'

const LIMITE_INICIAL = 10

interface LinhaRanking {
  pct_favoravel: number
  total_votacoes: number
  postura_geral: Postura
  parlamentares: {
    id: number
    nome: string
    partido: string
    uf: string
    foto_url: string | null
  } | null
}

function medalha(rank: number): string {
  if (rank === 1) return '#C99A2E'
  if (rank === 2) return '#9AA0A6'
  if (rank === 3) return '#B5742E'
  return '#C2C0B6'
}

interface Props {
  ranking: LinhaRanking[]
  tema: string
  slug: string
}

export function RankingList({ ranking, tema, slug }: Props) {
  const [expandido, setExpandido] = useState(false)

  const visiveis = expandido ? ranking : ranking.slice(0, LIMITE_INICIAL)
  const restantes = ranking.length - LIMITE_INICIAL

  return (
    <>
      {visiveis.map((r, i) => {
        const dep = r.parlamentares
        if (!dep) return null
        return (
          <RankingDeputado
            key={dep.id}
            rank={i + 1}
            pct={Math.round(Number(r.pct_favoravel))}
            postura={r.postura_geral}
            dep={dep}
            tema={tema}
            slug={slug}
            medalhaColor={medalha(i + 1)}
          />
        )
      })}

      {ranking.length > LIMITE_INICIAL && (
        <div className="flex justify-center border-t border-[#F0EDE3] py-4">
          <button
            onClick={() => setExpandido((e) => !e)}
            className="inline-flex items-center gap-2 rounded-[30px] border-[1.5px] border-[#C9C5B8] bg-white px-5 py-2 text-[13.5px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-white"
          >
            {expandido ? (
              <>
                Mostrar menos
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            ) : (
              <>
                Mostrar mais ({restantes})
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}
