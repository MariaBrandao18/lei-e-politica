import type { Postura } from '@/types'

export interface PosturaEstilo {
  label: string
  texto: string // cor do texto
  bg: string // cor de fundo da pill
  barra: string // cor da barra de progresso
}

const ESTILOS: Record<Postura, PosturaEstilo> = {
  favoravel: { label: 'Favorável', texto: '#1F7A5C', bg: '#E4F1EA', barra: '#1F7A5C' },
  neutro: { label: 'Neutro', texto: '#B08A28', bg: '#F6EFDA', barra: '#D7B45A' },
  contrario: { label: 'Contrário', texto: '#BE4A2F', bg: '#F8E6E0', barra: '#BE4A2F' },
}

export function posturaCor(postura: Postura): PosturaEstilo {
  return ESTILOS[postura] ?? ESTILOS.neutro
}

// Paleta determinística para avatares (mesma do mockup)
const PALETA = [
  '#13352F', '#1F7A5C', '#2E5F8A', '#8A5A2B',
  '#6B3F6E', '#9A6B1E', '#2B6E66', '#7A3326',
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function corAvatar(seed: string | number): string {
  return PALETA[hash(String(seed)) % PALETA.length]
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const a = partes[0]?.[0] ?? ''
  const b = partes[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

// Slug estável a partir do nome do tema (remove acentos e pontuação)
export function slugTema(tema: string): string {
  return tema
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
