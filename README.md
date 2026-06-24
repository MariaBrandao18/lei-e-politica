# Lei e Política

MVP acadêmico de ciência de dados — CEUB, Curso de Ciência de Dados.

## Hipótese

Os temas emergentes das proposições estão relacionados ao comportamento de voto dos parlamentares, e é possível **prever o voto individual de um deputado** (favorável/contrário) com acurácia ≥ 70% em split temporal, usando dados abertos e ML interpretável.

## Arquitetura

```
APIs Públicas (Câmara dos Deputados)
        ↓
Pipeline Python (Jupyter Notebooks)
coleta → limpa → clusteriza temas → prevê votos → agrega perfis
        ↓
Supabase (PostgreSQL + RLS + RPC)
        ↓
Next.js 15 na Vercel
```

## Sprints

| Sprint | Branch | Escopo | Status |
|--------|--------|--------|--------|
| 1 | `sprint/1-coleta` | Coleta de dados via API da Câmara (votações, parlamentares, proposições) | ✅ |
| 2 | `sprint/2-ml-texto` | Limpeza de texto + TF-IDF + K-Means (10 temas cidadãos) | ✅ |
| 3 | `sprint/3-perfil-ml` | RandomForest (predição de voto) + perfil descritivo por parlamentar×tema | ✅ |
| 4 | `sprint/4-frontend` | Frontend Next.js 15 + accordion de votos + deploy Vercel | ✅ |

## Notebooks

| Arquivo | Descrição |
|---------|-----------|
| `01_coleta_camara.ipynb` | Coleta parlamentares, proposições e votações nominais do Plenário |
| `02_limpeza_texto.ipynb` | Pré-processamento NLP das ementas |
| `03_clustering_temas.ipynb` | TF-IDF + K-Means → `tema_cluster` e `tema_cidadao` |
| `04_modelo_predicao_voto.ipynb` | RandomForestClassifier com split temporal 80/20 |
| `05_perfil_agregado.ipynb` | Perfil por deputado×tema (favorável / neutro / contrário) |

## Banco de dados (Supabase)

Tabelas principais:

| Tabela | Acesso público | Descrição |
|--------|---------------|-----------|
| `parlamentares` | ✅ anon read | Deputados federais |
| `proposicoes` | — | Proposições coletadas (RLS restrito) |
| `votacoes` | — | Votações do Plenário (RLS restrito) |
| `votos` | — | Votos individuais (RLS restrito) |
| `perfil_parlamentar` | ✅ anon read | Postura por deputado×tema |
| `metricas_modelo` | ✅ anon read | Acurácia e F1 do RandomForest |

RPC pública: `votos_por_tema(p_parlamentar_id, p_tema)` — retorna ementas e votos individuais para o accordion do frontend (SECURITY DEFINER, sem expor as tabelas base).

## Instalação (pipeline Python)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Crie um `.env` na raiz com:
```
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
```

## Instalação (frontend)

```bash
cd frontend
npm install
```

Crie `frontend/.env.local` com:
```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

```bash
npm run dev   # desenvolvimento → http://localhost:3000
npm run build # checar build antes do deploy
```

Deploy: conecte o repositório no [Vercel Dashboard](https://vercel.com) e configure as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Backlog pós-entrega

- Portal da Transparência (gastos de gabinete)
- LexML (texto integral das proposições)
- Votos nominais do Senado
