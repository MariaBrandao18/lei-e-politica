import type { Postura } from '@/types'
import { posturaCor } from '@/lib/postura'

export function PosturaTag({ postura }: { postura: Postura }) {
  const c = posturaCor(postura)
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-semibold"
      style={{ background: c.bg, color: c.texto }}
    >
      {c.label}
    </span>
  )
}
