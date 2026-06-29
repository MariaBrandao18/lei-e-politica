# Lei e Política

MVP acadêmico de ciência de dados — CEUB, Curso de Ciência de Dados.

## Hipótese

Os temas emergentes das proposições estão relacionados ao comportamento de voto dos parlamentares, e é possível **prever o voto individual de um deputado** (favorável/contrário) em split temporal, usando dados abertos e ML interpretável.

## Resultados

| Métrica | Valor | Meta inicial |
|---------|-------|-------------|
| Acurácia (teste) | **58,35%** | ≥ 70% |
| F1-macro (teste) | **0,470** | — |
| Temas substantivos | **11** | — |
| Deputados com perfil | **504** | — |
| Votações nominais analisadas | **137** | — |

A meta de 70% não foi atingida. A principal causa é a **disciplina partidária fraca no conjunto de dados**: a diferença de voto entre bloco governo (63,5%) e oposição (57,1%) é de apenas 6 pp, deixando pouca variância explicável por partido/UF/tema. A janela temporal coletada (votações nominais do Plenário com proposição identificável) soma 137 sessões — ampliar a janela seria o principal caminho para melhorar o modelo.

## Arquitetura

```
API Dados Abertos (Câmara dos Deputados)
        ↓
Pipeline Python (Jupyter Notebooks)
coleta → classifica natureza (regras) → clusteriza temas (ML) → enriquece → prevê voto → agrega perfis
        ↓
Supabase (PostgreSQL + RLS + RPC)
        ↓
Next.js 15 (deploy Vercel)
```

## Sprints

| Sprint | Branch | Escopo | Status |
|--------|--------|--------|--------|
| 1 | `sprint/1-coleta` | Coleta de parlamentares, proposições e votações nominais via API da Câmara | ✅ |
| 2 | `sprint/2-ml-texto` → redesign em `sprint/2-redesign-clustering` | Classificação em dois eixos: Eixo A (natureza, regras) + Eixo B (tema, TF-IDF + K-Means nas substantivas) | ✅ |
| 3 | `sprint/3-perfil-ml` | RandomForest (predição de voto) + perfil descritivo por parlamentar×tema | ✅ |
| 4 | `sprint/4-frontend` + `sprint/4.1-redesign-temas` + `sprint/4.2-enriquecimento` | Frontend Next.js 15 + design editorial + enriquecimento de proposições | ✅ |

## Notebooks

| Arquivo | Descrição |
|---------|-----------|
| `01_coleta_camara.ipynb` | Coleta parlamentares, proposições e votações nominais do Plenário via API da Câmara |
| `02_coleta_senado.ipynb` | Coleta proposições do Senado (base complementar) |
| `03_limpeza_clustering.ipynb` | **Dois eixos**: Eixo A classifica natureza por regras (A0–A3); Eixo B aplica TF-IDF + K-Means K=20 só nas proposições substantivas (A3). Grava `natureza_codigo`, `eixo`, `tema_cluster`, `tema_cidadao` |
| `04_modelo_predicao_voto.ipynb` | RandomForestClassifier + feature de coalizão (bloco governo/oposição/centro) + RandomizedSearchCV com TimeSeriesSplit. Split temporal 80/20 |
| `05_perfil_agregado.ipynb` | Perfil por deputado×tema: `pct_favoravel`, `total_votacoes` (por proposição única), `postura_geral` (favorável ≥65% / contrário ≤35% / neutro) |
| `06_enriquecimento_temas.ipynb` | Backfill de `votacoes.proposicao_id` para as 95 votações órfãs; classifica novas proposições pelos dois eixos sem re-treinar o K-Means |
| `07_validacao_amostral.ipynb` | Validação qualitativa: distribuição silhueta e maior-cluster antes/depois do redesign de dois eixos |

## Classificação em dois eixos

A inovação central da Sprint 2 substitui o K-Means global (que produzia um cluster catch-all de 62%) por dois estágios independentes:

**Eixo A — Natureza (regras determinísticas, `src/classificacao/natureza.py`)**

| Código | Rótulo | Critério |
|--------|--------|----------|
| `A0_Administrativa` | Requerimentos e Atos Internos | Licenças, requerimentos de informação, votos de pesar, moções, sessões solenes |
| `A1_Orcamentaria` | Créditos Orçamentários | Abertura de crédito especial/suplementar/extraordinário ao orçamento |
| `A2_Radiodifusao` | Outorgas de Radiodifusão | Renovações e concessões de radiodifusão |
| `A3_Substantiva` | *(definido no Eixo B)* | Todo o restante — segue para clusterização temática |

Princípio inviolável: a palavra "crédito" sozinha não decide Eixo A — "linha de crédito especial para microempreendedores" é A3, não A1.

**Eixo B — Tema (TF-IDF + K-Means, só nas A3)**

K=20, `sublinear_tf=True`, `max_df=0.30`, stopwords PT + jargão jurídico + nomes de meses (datas de lei achatavam o TF-IDF). 20 clusters temáticos + residual "Outras Políticas Públicas". 23 rótulos finais (20 temáticos + 3 de forma).

## Banco de dados (Supabase)

**Tabelas**

| Tabela | Acesso público | Descrição |
|--------|---------------|-----------|
| `parlamentares` | ✅ anon | Deputados federais (nome, partido, UF, foto) |
| `proposicoes` | — (RLS) | Proposições com `natureza_codigo`, `eixo`, `tema_cluster`, `tema_cidadao` |
| `votacoes` | — (RLS) | Votações do Plenário linkadas à proposição |
| `votos` | — (RLS) | Voto individual por (parlamentar, votação) |
| `perfil_parlamentar` | ✅ anon | Postura por deputado×tema (`pct_favoravel`, `total_votacoes`, `postura_geral`) |
| `metricas_modelo` | ✅ anon | Acurácia e F1 do RandomForest (lido ao vivo pelo frontend) |

**Migrações**

| Arquivo | Descrição |
|---------|-----------|
| `migrations/001_schema.sql` | Schema inicial (todas as tabelas, RLS, índices) |
| `migrations/002_dois_eixos.sql` | Colunas `natureza_codigo` e `eixo` em `proposicoes` |

**RPCs públicas (SECURITY DEFINER)**

| Função | Parâmetros | Retorno |
|--------|-----------|---------|
| `votos_por_tema(p_parlamentar_id, p_tema)` | id do deputado, nome do tema | Votos individuais para o accordion do perfil |
| `proposicoes_do_tema(p_tema)` | nome do tema | Proposições com contagem SIM/NÃO para o ranking da página de tema |

## Frontend (Next.js 15)

Páginas server-rendered com ISR (revalidate=3600):

| Rota | Descrição |
|------|-----------|
| `/` | Home com métricas reais do modelo e explicação do produto |
| `/deputados` | Lista de deputados com busca e filtro por partido |
| `/deputados/[id]` | Perfil: postura geral + accordion de votos por tema |
| `/temas` | Lista de temas com média favorável e top deputado |
| `/temas/[slug]` | Ranking de deputados no tema + proposições mais votadas e rejeitadas |

Design: verde-escuro `#13352F` + dourado `#E8B43A` + fundo creme `#F4F2EC`. Fontes Newsreader (serif) + Public Sans.

## Instalação (pipeline Python)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Crie `.env` na raiz com:
```
SUPABASE_URL=https://woxluznsfqskopzzjqtf.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
```

> **Atenção:** se a variável `SUPABASE_URL` já estiver no shell (stale de outro projeto), use override inline ao executar notebooks:
> ```bash
> SUPABASE_URL=https://woxluznsfqskopzzjqtf.supabase.co \
>   SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env | cut -d= -f2-) \
>   .venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/XX.ipynb
> ```

## Instalação (frontend)

```bash
cd frontend
npm install
```

Crie `frontend/.env.local` com:
```
NEXT_PUBLIC_SUPABASE_URL=https://woxluznsfqskopzzjqtf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

```bash
npm run dev    # desenvolvimento → http://localhost:3000
npm run build  # validar antes do deploy
```

Deploy: conecte o repositório no [Vercel Dashboard](https://vercel.com) e configure as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Backlog pós-entrega

- Ampliar janela temporal de coleta (principal alavanca para melhorar acurácia do modelo)
- Votos nominais do Senado
- Texto integral das proposições via LexML (features NLP mais ricas)
- Portal da Transparência (gastos de gabinete como feature)
