'use client'

import { useMemo, useState } from 'react'
import { DeputadoCard } from '@/components/DeputadoCard'
import type { DeputadoComPerfil } from '@/types'

export function DeputadosList({ deputados }: { deputados: DeputadoComPerfil[] }) {
  const [busca, setBusca] = useState('')
  const [partido, setPartido] = useState('Todos')

  const partidos = useMemo(
    () => ['Todos', ...Array.from(new Set(deputados.map((d) => d.partido).filter(Boolean))).sort()],
    [deputados],
  )

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return deputados.filter((d) => {
      const casaBusca =
        !q ||
        d.nome.toLowerCase().includes(q) ||
        d.partido.toLowerCase().includes(q) ||
        d.uf.toLowerCase().includes(q)
      const casaPartido = partido === 'Todos' || d.partido === partido
      return casaBusca && casaPartido
    })
  }, [deputados, busca, partido])

  return (
    <div>
      {/* Busca */}
      <div className="relative mb-3.5">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9A9D90"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar deputado, partido ou UF…"
          className="w-full rounded-[13px] border-[1.5px] border-[#DAD6C9] bg-white py-[15px] pl-11 pr-4 text-[15.5px] font-medium outline-none focus:border-forest"
        />
      </div>

      {/* Chips de partido */}
      <div className="mb-[26px] flex flex-wrap gap-[7px]">
        {partidos.map((p) => {
          const on = partido === p
          return (
            <button
              key={p}
              onClick={() => setPartido(p)}
              className={`rounded-full border-[1.5px] px-3.5 py-[7px] text-[13px] font-semibold transition-colors ${
                on
                  ? 'border-forest bg-forest text-white'
                  : 'border-[#DAD6C9] bg-white text-muted hover:border-forest'
              }`}
            >
              {p === 'Todos' ? 'Todos os partidos' : p}
            </button>
          )
        })}
      </div>

      {filtrados.length === 0 ? (
        <p className="py-[50px] text-center text-[15px] text-[#9A9D90]">
          Nenhum deputado encontrado{busca && ` para “${busca}”`}.
        </p>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((d) => (
            <DeputadoCard key={d.id} deputado={d} />
          ))}
        </div>
      )}
    </div>
  )
}
