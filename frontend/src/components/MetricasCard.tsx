import type { MetricasModelo } from '@/types'

export function MetricasCard({ metricas }: { metricas: MetricasModelo }) {
  const acuracia = (metricas.acuracia * 100).toFixed(1)
  const f1 = (metricas.f1_macro * 100).toFixed(1)
  const atingiu = metricas.acuracia >= 0.70

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        Desempenho do Modelo de Previsão
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Acurácia" value={`${acuracia}%`} highlight={atingiu} />
        <Stat label="F1 Macro" value={`${f1}%`} />
        <Stat label="Votos no treino" value={metricas.n_treino.toLocaleString('pt-BR')} />
        <Stat label="Votos no teste" value={metricas.n_teste.toLocaleString('pt-BR')} />
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Modelo: <span className="font-mono">{metricas.modelo}</span> · corte temporal:{' '}
        {new Date(metricas.data_corte).toLocaleDateString('pt-BR')} · treinado em{' '}
        {new Date(metricas.created_at).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  )
}
