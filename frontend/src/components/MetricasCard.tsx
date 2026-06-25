import type { MetricasModelo } from '@/types'

export function MetricasCard({ metricas }: { metricas: MetricasModelo }) {
  const acuracia = (metricas.acuracia * 100).toFixed(1).replace('.', ',')
  const f1 = (metricas.f1_macro * 100).toFixed(1).replace('.', ',')

  const stats = [
    { value: `${acuracia}%`, label: 'Acurácia da previsão', cor: '#E8B43A' },
    { value: `${f1}%`, label: 'F1 macro', cor: '#F4F2EC' },
    { value: metricas.n_treino.toLocaleString('pt-BR'), label: 'Votos no treino', cor: '#F4F2EC' },
    { value: metricas.n_teste.toLocaleString('pt-BR'), label: 'Votos no teste', cor: '#F4F2EC' },
  ]

  const corte = new Date(metricas.data_corte).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="rounded-[18px] bg-forest p-9 text-cream">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-medium">Transparência do modelo</h2>
        <span className="text-[13px] text-[#9DB5AE]">
          {metricas.modelo} · corte temporal em {corte}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[13px] border border-white/[0.09] bg-white/5 p-5"
          >
            <div
              className="font-serif text-[34px] font-semibold tracking-tight tabular-nums"
              style={{ color: s.cor }}
            >
              {s.value}
            </div>
            <div className="mt-1 text-[13.5px] text-[#9DB5AE]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
