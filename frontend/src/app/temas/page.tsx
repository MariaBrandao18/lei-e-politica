import Link from 'next/link'
import { buscarResumoTemas } from '@/lib/temas'
import { corAvatar, iniciais } from '@/lib/postura'

export const revalidate = 3600

export default async function TemasPage() {
  const temas = await buscarResumoTemas()

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-[90px] pt-12">
      <h1 className="mb-1.5 font-serif text-[38px] font-medium tracking-[-.015em]">
        Temas das leis
      </h1>
      <p className="mb-[30px] max-w-[62ch] text-[16px] text-muted">
        Escolha uma categoria e abra o ranking dos deputados — do mais favorável ao mais
        contrário àquele tema.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {temas.map((t) => (
          <Link
            key={t.slug}
            href={`/temas/${t.slug}`}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-forest hover:shadow-[0_14px_32px_-22px_rgba(19,53,47,.6)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-[5px] text-[11px] font-semibold uppercase tracking-[.08em] text-faint">
                  Categoria
                </div>
                <div className="font-serif text-2xl font-semibold leading-[1.08]">{t.tema}</div>
              </div>
              <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-fav">
                {t.media}% médio
              </span>
            </div>

            <div className="h-[9px] overflow-hidden rounded-md bg-[#EFECE2]">
              <div className="h-full rounded-md bg-fav" style={{ width: `${t.media}%` }} />
            </div>

            <div className="flex items-center justify-between gap-2.5 border-t border-[#F0EDE3] pt-[15px]">
              {t.top ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white"
                    style={{ background: corAvatar(t.top.id) }}
                  >
                    {iniciais(t.top.nome)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-faint">Mais favorável</div>
                    <div className="truncate text-[14px] font-semibold">{t.top.nome}</div>
                  </div>
                </div>
              ) : (
                <span className="text-[13px] text-faint">{t.nDeputados} deputados</span>
              )}
              <span className="whitespace-nowrap text-[13.5px] font-bold text-forest">
                Ver ranking →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
