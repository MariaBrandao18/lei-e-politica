import type { PerfilParlamentar, Postura } from '@/types'

export interface ResumoDeputado {
  media: number // média de pct_favoravel entre os temas
  fav: number // nº de temas favoráveis
  neu: number // nº de temas neutros
  con: number // nº de temas contrários
  total: number // nº de temas com dados
  topTema: string | null // tema com maior pct_favoravel
  posturaGeral: Postura | null
}

export function resumoDeputado(perfil: PerfilParlamentar[]): ResumoDeputado {
  const total = perfil.length
  if (total === 0) {
    return { media: 0, fav: 0, neu: 0, con: 0, total: 0, topTema: null, posturaGeral: null }
  }
  const fav = perfil.filter((p) => p.postura_geral === 'favoravel').length
  const con = perfil.filter((p) => p.postura_geral === 'contrario').length
  const neu = total - fav - con
  const media = Math.round(perfil.reduce((a, p) => a + Number(p.pct_favoravel), 0) / total)
  const top = perfil.reduce((a, p) =>
    Number(p.pct_favoravel) > Number(a.pct_favoravel) ? p : a,
  )
  return { media, fav, neu, con, total, topTema: top.tema_cidadao, posturaGeral: posturaDaMedia(media) }
}

// Classifica a média num rótulo de postura (mesmos limiares do banco: ≥65 / ≤35)
export function posturaDaMedia(media: number): Postura {
  if (media >= 65) return 'favoravel'
  if (media <= 35) return 'contrario'
  return 'neutro'
}
