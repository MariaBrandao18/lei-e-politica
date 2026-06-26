"""Classificação de proposições em dois eixos.

Eixo A — Natureza (regras determinísticas, módulo ``natureza``).
Eixo B — Tema (TF-IDF + K-Means, notebook ``03_limpeza_clustering``).
"""

from .natureza import REGRAS_NATUREZA, ROTULO_NATUREZA, classificar_natureza

__all__ = ["REGRAS_NATUREZA", "ROTULO_NATUREZA", "classificar_natureza"]
