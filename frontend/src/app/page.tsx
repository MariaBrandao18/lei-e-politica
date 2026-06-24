import { supabase } from '@/lib/supabase'
import { MetricasCard } from '@/components/MetricasCard'
import type { MetricasModelo } from '@/types'

export const revalidate = 3600

async function getMetricas(): Promise<MetricasModelo | null> {
  const { data } = await supabase
    .from('metricas_modelo')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export default async function HomePage() {
  const metricas = await getMetricas()

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Lei e Política</h1>
        <p className="mt-4 text-lg text-gray-600">
          Como cada deputado federal vota em cada tema? Usamos ciência de dados para
          revelar padrões e prever posicionamentos parlamentares.
        </p>
        <a
          href="/deputados"
          className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Ver perfil dos deputados →
        </a>
      </section>

      {/* Como funciona */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">Como funciona</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            num="1"
            title="Coleta de dados"
            desc="Coletamos votações nominais do Plenário da Câmara via API aberta e agrupamos as proposições em 10 temas por TF-IDF + K-Means."
          />
          <Step
            num="2"
            title="Perfil parlamentar"
            desc="Calculamos o percentual de votos favoráveis de cada deputado por tema e classificamos a postura (favorável, neutro, contrário)."
          />
          <Step
            num="3"
            title="Previsão de voto"
            desc="Um RandomForest treinado com partido, UF e histórico de votações por tema prevê como um deputado tende a votar."
          />
        </div>
      </section>

      {/* Métricas do modelo */}
      {metricas && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Transparência do modelo
          </h2>
          <MetricasCard metricas={metricas} />
        </section>
      )}
    </div>
  )
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
        {num}
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  )
}
