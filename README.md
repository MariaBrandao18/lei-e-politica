# Lei e Política

MVP acadêmico de ciência de dados — CEUB, Curso de Ciência de Dados.

## Hipótese

Os temas emergentes das proposições estão relacionados ao comportamento de voto dos parlamentares, e é possível **prever o voto individual de um deputado** (favorável/contrário) com acurácia ≥ 70% em split temporal, usando dados abertos e ML interpretável.

## Arquitetura

```
APIs Públicas (Câmara · Senado)
        ↓
Pipeline Python (Jupyter Notebooks)
coleta → limpa → clusteriza temas → prevê votos → agrega perfis
        ↓
Supabase (PostgreSQL)
        ↓
Next.js 14 na Vercel
```

## Sprints

| Sprint | Branch | Escopo |
|--------|--------|--------|
| 1 | `sprint/1-coleta` | Coleta de dados (Câmara + Senado) |
| 2 | `sprint/2-ml-texto` | TF-IDF + K-Means (clustering de temas) |
| 3 | `sprint/3-perfil-ml` | RandomForest (predição de voto) + perfil descritivo |
| 4 | `sprint/4-fullstack` | Frontend Next.js + deploy Vercel |

## Instalação

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Crie um `.env` na raiz com:
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

## Backlog pós-entrega

- Portal da Transparência (gastos de gabinete)
- LexML (texto integral das proposições)
- Votos nominais do Senado (stretch goal da Sprint 1)
