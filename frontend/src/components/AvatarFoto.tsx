'use client'

import { useState } from 'react'
import { corAvatar, iniciais } from '@/lib/postura'

interface Props {
  nome: string
  id: number
  fotoUrl: string | null
  size: number
  fontSize: string
}

export function AvatarFoto({ nome, id, fotoUrl, size, fontSize }: Props) {
  const [erro, setErro] = useState(false)

  if (fotoUrl && !erro) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        width={size}
        height={size}
        onError={() => setErro(true)}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: corAvatar(id), fontSize }}
    >
      {iniciais(nome)}
    </div>
  )
}
