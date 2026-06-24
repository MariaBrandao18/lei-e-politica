export type Postura = 'favoravel' | 'neutro' | 'contrario'

export interface Parlamentar {
  id: number
  id_externo: number
  casa: string
  nome: string
  partido: string
  uf: string
  foto_url: string | null
}

export interface PerfilParlamentar {
  tema_cidadao: string
  pct_favoravel: number
  total_votacoes: number
  postura_geral: Postura
}

export interface MetricasModelo {
  id: number
  modelo: string
  acuracia: number
  f1_macro: number
  data_corte: string
  n_treino: number
  n_teste: number
  created_at: string
}
