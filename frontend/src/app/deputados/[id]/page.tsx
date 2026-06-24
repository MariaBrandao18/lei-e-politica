import { notFound } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { VotoAccordion } from '@/components/VotoAccordion'
import type { Parlamentar, PerfilParlamentar } from '@/types'

export const revalidate = 3600

export async function generateStaticParams() {
  const { data } = await supabase
    .from('parlamentares')
    .select('id')
    .eq('casa', 'camara')
  return (data ?? []).map((p) => ({ id: String(p.id) }))
}

async function getDeputado(id: number): Promise<Parlamentar | null> {
  const { data } = await supabase
    .from('parlamentares')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function getPerfil(parlamentarId: number): Promise<PerfilParlamentar[]> {
  const { data } = await supabase
    .from('perfil_parlamentar')
    .select('tema_cidadao, pct_favoravel, total_votacoes, postura_geral')
    .eq('parlamentar_id', parlamentarId)
    .order('total_votacoes', { ascending: false })
  return data ?? []
}

export default async function DeputadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (isNaN(id)) notFound()

  const [deputado, perfil] = await Promise.all([getDeputado(id), getPerfil(id)])
  if (!deputado) notFound()

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-5">
        {deputado.foto_url ? (
          <Image
            src={deputado.foto_url}
            alt={deputado.nome}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
            {deputado.nome[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{deputado.nome}</h1>
          <p className="text-gray-500">
            {deputado.partido} · {deputado.uf}
          </p>
        </div>
      </div>

      {/* Perfil por tema com accordion */}
      <section>
        <h2 className="mb-1 text-xl font-semibold text-gray-800">
          Postura de voto por tema
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Clique em um tema para ver as propostas votadas individualmente.
        </p>
        {perfil.length === 0 ? (
          <p className="text-gray-400">
            Sem dados suficientes de votação (mínimo 3 votos por tema).
          </p>
        ) : (
          <VotoAccordion parlamentarId={id} perfil={perfil} />
        )}
      </section>

      <a href="/deputados" className="text-sm text-blue-600 hover:underline">
        ← Voltar para todos os deputados
      </a>
    </div>
  )
}
