'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Parlamentar } from '@/types'

export function DeputadosList({ deputados }: { deputados: Parlamentar[] }) {
  const [busca, setBusca] = useState('')

  const filtrados = deputados.filter((d) => {
    const q = busca.toLowerCase()
    return d.nome.toLowerCase().includes(q) || d.partido.toLowerCase().includes(q) || d.uf.toLowerCase().includes(q)
  })

  return (
    <div>
      <input
        type="search"
        placeholder="Buscar por nome, partido ou UF..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {filtrados.length === 0 && (
        <p className="text-center text-gray-400">Nenhum deputado encontrado.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((d) => (
          <a
            key={d.id}
            href={`/deputados/${d.id}`}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md"
          >
            {d.foto_url ? (
              <Image
                src={d.foto_url}
                alt={d.nome}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500">
                {d.nome[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{d.nome}</p>
              <p className="text-xs text-gray-500">
                {d.partido} · {d.uf}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
