import { supabase } from '@/lib/supabase'
import type { Parlamentar } from '@/types'
import { DeputadosList } from './DeputadosList'

export const revalidate = 3600

async function getDeputados(): Promise<Parlamentar[]> {
  const { data } = await supabase
    .from('parlamentares')
    .select('id, id_externo, casa, nome, partido, uf, foto_url')
    .eq('casa', 'camara')
    .order('nome')
  return data ?? []
}

export default async function DeputadosPage() {
  const deputados = await getDeputados()

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Deputados Federais</h1>
      <p className="mb-6 text-gray-500">
        {deputados.length} deputados · clique para ver o perfil de votação por tema
      </p>
      <DeputadosList deputados={deputados} />
    </div>
  )
}
