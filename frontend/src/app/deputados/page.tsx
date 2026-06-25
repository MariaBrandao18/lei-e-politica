import { supabase } from '@/lib/supabase'
import type { DeputadoComPerfil } from '@/types'
import { DeputadosList } from './DeputadosList'

export const revalidate = 3600

async function getDeputados(): Promise<DeputadoComPerfil[]> {
  const { data } = await supabase
    .from('parlamentares')
    .select(
      'id, nome, partido, uf, foto_url, perfil_parlamentar(tema_cidadao, pct_favoravel, total_votacoes, postura_geral)',
    )
    .eq('casa', 'camara')
    .order('nome')
  return (data ?? []) as unknown as DeputadoComPerfil[]
}

export default async function DeputadosPage() {
  const deputados = await getDeputados()

  return (
    <main className="mx-auto max-w-[1080px] px-7 pb-[90px] pt-12">
      <h1 className="mb-1.5 font-serif text-[38px] font-medium tracking-[-.015em]">Deputados</h1>
      <p className="mb-[26px] text-[16px] text-muted">
        {deputados.length} parlamentares · busque por nome, partido ou estado.
      </p>
      <DeputadosList deputados={deputados} />
    </main>
  )
}
