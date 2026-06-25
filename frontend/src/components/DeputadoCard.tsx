import Link from 'next/link'
import { corAvatar, iniciais } from '@/lib/postura'
import { resumoDeputado } from '@/lib/agregacao'
import type { DeputadoComPerfil } from '@/types'

export function DeputadoCard({ deputado }: { deputado: DeputadoComPerfil }) {
  const r = resumoDeputado(deputado.perfil_parlamentar)
  const pct = (n: number) => (r.total ? `${(n / r.total) * 100}%` : '0%')

  return (
    <Link
      href={`/deputados/${deputado.id}`}
      className="flex flex-col gap-3.5 rounded-[15px] border border-line bg-white p-[18px] transition-all hover:border-forest hover:shadow-[0_10px_26px_-18px_rgba(19,53,47,.55)]"
    >
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full text-[17px] font-bold text-white"
          style={{ background: corAvatar(deputado.id) }}
        >
          {iniciais(deputado.nome)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15.5px] font-semibold leading-tight">
            {deputado.nome}
          </div>
          <div className="mt-0.5 text-[13px] text-[#7A7D70]">
            {deputado.partido} · {deputado.uf}
          </div>
        </div>
      </div>

      {r.total > 0 ? (
        <div>
          <div className="flex h-2 overflow-hidden rounded-[5px] bg-[#EFECE2]">
            <div style={{ width: pct(r.fav), background: '#1F7A5C' }} />
            <div style={{ width: pct(r.neu), background: '#D7B45A' }} />
            <div style={{ width: pct(r.con), background: '#BE4A2F' }} />
          </div>
          <div className="mt-[7px] flex justify-between text-[12px] text-faint">
            <span>
              Mais favorável: <b className="font-semibold text-ink">{r.topTema}</b>
            </span>
            <span className="tabular-nums">{r.media}% médio</span>
          </div>
        </div>
      ) : (
        <div className="text-[12px] text-faint">Sem votações analisadas.</div>
      )}
    </Link>
  )
}
