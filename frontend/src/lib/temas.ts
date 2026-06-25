import { supabase } from '@/lib/supabase'
import { slugTema } from '@/lib/postura'

export interface TopDeputado {
  id: number
  nome: string
  partido: string
  uf: string
}

export interface ResumoTema {
  tema: string
  slug: string
  nDeputados: number
  media: number
  top: TopDeputado | null
}

interface LinhaPerfil {
  tema_cidadao: string
  pct_favoravel: number
  parlamentares: { id: number; nome: string; partido: string; uf: string } | null
}

// Busca todas as linhas de perfil e agrega por tema (n deputados, média, top deputado).
export async function buscarResumoTemas(): Promise<ResumoTema[]> {
  const { data } = await supabase
    .from('perfil_parlamentar')
    .select('tema_cidadao, pct_favoravel, parlamentares(id, nome, partido, uf)')

  const linhas = (data ?? []) as unknown as LinhaPerfil[]

  const mapa = new Map<string, { soma: number; n: number; top: LinhaPerfil | null }>()
  for (const l of linhas) {
    const atual = mapa.get(l.tema_cidadao) ?? { soma: 0, n: 0, top: null }
    atual.soma += Number(l.pct_favoravel)
    atual.n += 1
    if (!atual.top || Number(l.pct_favoravel) > Number(atual.top.pct_favoravel)) {
      atual.top = l
    }
    mapa.set(l.tema_cidadao, atual)
  }

  return Array.from(mapa.entries())
    .map(([tema, v]) => ({
      tema,
      slug: slugTema(tema),
      nDeputados: v.n,
      media: Math.round(v.soma / v.n),
      top: v.top?.parlamentares
        ? {
            id: v.top.parlamentares.id,
            nome: v.top.parlamentares.nome,
            partido: v.top.parlamentares.partido,
            uf: v.top.parlamentares.uf,
          }
        : null,
    }))
    .sort((a, b) => b.nDeputados - a.nDeputados)
}
