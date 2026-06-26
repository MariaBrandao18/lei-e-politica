"""Auditoria de qualidade da clusterização atual (diagnóstico do Eixo A).

Lê todas as proposições do Supabase, aplica o Eixo A (natureza por regras) e
cruza com o ``tema_cidadao`` ATUAL (K-Means global K=10) para medir, com
números, os dois defeitos estruturais do modelo antigo:

  1. Cluster catch-all — 62% da base num único balde.
  2. Vazamento de forma — ~28% da base é "ruído de forma" (licença,
     requerimento, outorga, crédito) que nunca deveria ter ido ao K-Means
     temático; e microcrédito social vazou para o cluster de orçamento.

Saídas (em data/audit/):
  - relatorio_natureza.csv         distribuição por natureza (Eixo A)
  - substantivas_em_cluster_forma.csv  A3 substantivas presas em clusters de forma
  - casos_mal_classificados.csv    props no cluster "Créditos" que NÃO são A1
  - resumo_auditoria.txt           texto-resumo reproduzindo a Seção 2.3 do brief

Uso:  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python auditoria_clusters.py
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.db import buscar_todos
from src.classificacao.natureza import classificar_natureza

SAIDA = Path(__file__).resolve().parent / "data" / "audit"
SAIDA.mkdir(parents=True, exist_ok=True)

# Clusters do K-Means global antigo que são, na verdade, FORMA (não tema).
# Usados para medir quantas substantivas reais caíram em baldes de forma.
CLUSTERS_DE_FORMA = {
    "Destaques e Requerimentos de Votação",
    "Licenças Parlamentares",
    "Radiodifusão Sonora (Rádio FM/AM)",
    "Radiodifusão Comunitária",
    "Requerimentos e Regimento Interno",
    "Créditos e Orçamento Federal",
}
CLUSTER_ORCAMENTO = "Créditos e Orçamento Federal"


def main() -> None:
    df = pd.DataFrame(
        buscar_todos("proposicoes", "id_externo,casa,ementa,tema_cluster,tema_cidadao")
    )
    total = len(df)
    print(f"Proposições carregadas: {total}")

    # Eixo A em toda a base
    nat = df["ementa"].map(classificar_natureza)
    df["natureza_codigo"] = nat.map(lambda x: x[0])

    # --- relatorio_natureza.csv ---
    rel = (
        df["natureza_codigo"].value_counts().rename("n").reset_index()
    )
    rel.columns = ["natureza_codigo", "n"]
    rel["pct"] = (100 * rel["n"] / total).round(1)
    rel.to_csv(SAIDA / "relatorio_natureza.csv", index=False)

    n_a3 = int((df["natureza_codigo"] == "A3_Substantiva").sum())
    pct_a3 = 100 * n_a3 / total
    pct_ruido = 100 - pct_a3

    # --- substantivas_em_cluster_forma.csv ---
    # A3 reais que o K-Means global jogou num balde de FORMA: deveriam ter sido
    # tematizadas, mas foram rotuladas por forma.
    massa = df[
        (df["natureza_codigo"] == "A3_Substantiva")
        & (df["tema_cidadao"].isin(CLUSTERS_DE_FORMA))
    ][["id_externo", "casa", "tema_cidadao", "ementa"]]
    massa.to_csv(SAIDA / "substantivas_em_cluster_forma.csv", index=False)

    # --- casos_mal_classificados.csv ---
    # No cluster "Créditos e Orçamento Federal", quais NÃO são crédito
    # orçamentário de verdade (A1)? É o vazamento do microcrédito social.
    no_balde_credito = df[df["tema_cidadao"] == CLUSTER_ORCAMENTO].copy()
    mal = no_balde_credito[no_balde_credito["natureza_codigo"] != "A1_Orcamentaria"][
        ["id_externo", "casa", "natureza_codigo", "tema_cidadao", "ementa"]
    ]
    mal.to_csv(SAIDA / "casos_mal_classificados.csv", index=False)

    n_credito_real = int(
        (no_balde_credito["natureza_codigo"] == "A1_Orcamentaria").sum()
    )

    # maior cluster atual
    top_cluster = df["tema_cidadao"].value_counts().idxmax()
    n_top = int(df["tema_cidadao"].value_counts().max())

    # --- resumo_auditoria.txt ---
    linhas = [
        "AUDITORIA DE CLUSTERIZAÇÃO — Lei e Política (Sprint 2)",
        "=" * 60,
        f"Base total de proposições: {total}",
        "",
        "[Defeito 1] Cluster catch-all (K-Means global K=10)",
        f"  Maior cluster: '{top_cluster}'",
        f"  Concentra {n_top} proposições ({100*n_top/total:.1f}% da base).",
        "",
        "[Defeito 2] Vazamento de forma (Eixo A — regras sobre a ementa)",
    ]
    for _, r in rel.sort_values("n", ascending=False).iterrows():
        linhas.append(f"  {r['natureza_codigo']:18s} {int(r['n']):6d}  {r['pct']:5.1f}%")
    linhas += [
        "",
        f"  Substantivas (A3): {n_a3} ({pct_a3:.1f}%) — só estas vão ao Eixo B.",
        f"  Ruído de forma (A0+A1+A2): {pct_ruido:.1f}% — nunca deveria ter ido ao K-Means.",
        "",
        f"[Vazamento microcrédito] Cluster '{CLUSTER_ORCAMENTO}'",
        f"  Total no balde: {len(no_balde_credito)}",
        f"  Crédito orçamentário REAL (A1): {n_credito_real}",
        f"  Vazamento (não-A1, ex.: microcrédito social): {len(mal)}",
        "",
        "Conclusão: a separação em dois eixos remove o ruído de forma do",
        "K-Means e devolve o microcrédito social ao seu lugar substantivo.",
    ]
    resumo = "\n".join(linhas)
    (SAIDA / "resumo_auditoria.txt").write_text(resumo + "\n", encoding="utf-8")

    print("\n" + resumo)
    print(f"\nArquivos gravados em {SAIDA}/")


if __name__ == "__main__":
    main()
