interface ProposicaoTema {
  ementa: string
  n_sim: number
  n_nao: number
  aprovada: boolean
}

interface Props {
  proposicoes: ProposicaoTema[]
}

function truncar(texto: string, max = 120): string {
  return texto.length <= max ? texto : texto.slice(0, max).trimEnd() + '…'
}

function ItemProposicao({ prop, numero }: { prop: ProposicaoTema; numero: number }) {
  const total = prop.n_sim + prop.n_nao
  const pctSim = total > 0 ? Math.round((prop.n_sim / total) * 100) : 0

  return (
    <div className="mb-3 rounded-[11px] border border-[#EDEAE0] bg-surface p-3.5">
      <div className="mb-2.5 flex items-start gap-2.5">
        <span className="mt-0.5 min-w-[18px] font-serif text-[14px] font-semibold text-faint">
          {numero}
        </span>
        <p className="text-[13px] leading-relaxed text-[#33362E]">
          {truncar(prop.ementa)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative h-[7px] flex-1 overflow-hidden rounded-full bg-[#EFECE2]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-fav"
            style={{ width: `${pctSim}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 rounded-full bg-con"
            style={{ width: `${100 - pctSim}%` }}
          />
        </div>
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] font-semibold tabular-nums">
        <span className="text-fav">SIM {prop.n_sim}</span>
        <span className="text-con">NÃO {prop.n_nao}</span>
      </div>
    </div>
  )
}

export function ProposicoesTema({ proposicoes }: Props) {
  const aprovadas = proposicoes
    .filter((p) => p.aprovada)
    .sort((a, b) => b.n_sim - a.n_sim)

  const rejeitadas = proposicoes
    .filter((p) => !p.aprovada)
    .sort((a, b) => b.n_nao - a.n_nao)

  if (proposicoes.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-1 font-serif text-[21px] font-semibold">Proposições do tema</h2>
        <p className="text-[13px] text-muted">
          Nenhuma proposição deste tema foi a plenário ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-0.5 font-serif text-[21px] font-semibold">Proposições do tema</h2>
      <p className="mb-5 text-[13px] text-muted">
        Como o Plenário decidiu as propostas deste tema.
      </p>

      {aprovadas.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-fav" />
            <span className="text-[11px] font-bold uppercase tracking-[.08em] text-fav">
              Mais bem votadas
            </span>
          </div>
          {aprovadas.map((p, i) => (
            <ItemProposicao key={i} prop={p} numero={i + 1} />
          ))}
        </section>
      )}

      {rejeitadas.length > 0 && (
        <section className={aprovadas.length > 0 ? 'mt-5' : ''}>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-con" />
            <span className="text-[11px] font-bold uppercase tracking-[.08em] text-con">
              Rejeitadas
            </span>
          </div>
          {rejeitadas.map((p, i) => (
            <ItemProposicao key={i} prop={p} numero={i + 1} />
          ))}
        </section>
      )}
    </div>
  )
}
