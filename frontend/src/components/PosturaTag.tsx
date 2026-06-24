import type { Postura } from '@/types'

const config: Record<Postura, { label: string; className: string }> = {
  favoravel: {
    label: 'Favorável',
    className: 'bg-green-100 text-green-800 border border-green-300',
  },
  neutro: {
    label: 'Neutro',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  },
  contrario: {
    label: 'Contrário',
    className: 'bg-red-100 text-red-800 border border-red-300',
  },
}

export function PosturaTag({ postura }: { postura: Postura }) {
  const { label, className } = config[postura]
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
