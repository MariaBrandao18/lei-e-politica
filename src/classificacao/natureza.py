"""Eixo A — Natureza do instrumento legislativo (classificação por regras).

Por que regras e não ML
------------------------
A natureza de uma licença, requerimento, outorga de radiodifusão ou abertura
de crédito orçamentário é identificável por **padrão textual estável** na
ementa. Isso é trabalho de regra determinística e auditável, não de
clustering: jogar essas ~28% de "ruído de forma" no K-Means temático foi o que
produziu o cluster catch-all de 62% no modelo antigo (ver ``auditoria_clusters.py``).

Categorias (em ordem de precedência de aplicação)
-------------------------------------------------
- ``A0_Administrativa`` — licenças, requerimentos de informação, destaques,
  votação em separado, regimento interno, votos de pesar/aplauso/repúdio, moções.
  A *forma* manda: um "requerimento de informação à Ministra da Saúde" é forma,
  não tema de saúde.
- ``A2_Radiodifusao`` — outorgas e renovações de concessão de radiodifusão.
- ``A1_Orcamentaria`` — **abertura** de crédito especial/suplementar/
  extraordinário ao orçamento. Exige o verbo de abertura ("Abre ... crédito ...
  ao Orçamento") OU crédito + qualificador + contexto orçamentário. A palavra
  "crédito" sozinha NÃO decide: *microcrédito social* (ex.: "linha de crédito
  especial para financiar...") permanece substantivo (princípio inviolável 3).
- ``A3_Substantiva`` — tudo que sobra: PL/PEC/PLP que efetivamente alteram o
  ordenamento. **Só estas seguem para o Eixo B (tema).**

A ordem importa: A0 vem antes de A1/A2 porque a forma administrativa domina o
assunto (um requerimento sobre crédito ainda é requerimento). A1 vem por último
e é a regra mais estrita, justamente para não capturar microcrédito social.
"""

import re
import unicodedata

# Rótulo cidadão fixo de cada natureza de forma (A0/A1/A2). O A3 não tem rótulo
# fixo: seu ``tema_cidadao`` vem do Eixo B (tema descoberto por K-Means).
ROTULO_NATUREZA: dict[str, str] = {
    "A0_Administrativa": "Requerimentos e Atos Internos",
    "A1_Orcamentaria": "Créditos Orçamentários",
    "A2_Radiodifusao": "Outorgas de Radiodifusão",
    "A3_Substantiva": None,  # definido no Eixo B
}


def _norm(texto: str) -> str:
    """Minúsculas + remoção de acentos. As regras operam sobre texto desacentuado."""
    t = unicodedata.normalize("NFKD", str(texto).lower())
    return "".join(c for c in t if not unicodedata.combining(c))


# Regras ordenadas: a primeira que casar define a natureza. Cada padrão opera
# sobre a ementa normalizada (minúscula, sem acento).
REGRAS_NATUREZA: list[tuple[str, re.Pattern]] = [
    (
        "A0_Administrativa",
        re.compile(
            r"\b(licenca|licencas)\b"                       # licenças parlamentares
            r"|requer.{0,40}(informacoes|sejam prestadas)"  # requerimento de informação
            r"|requerimento de informac"
            r"|solicita.{0,20}informacoes"
            r"|votacao em separado|\bdestaque\b"            # destaques
            r"|regimento interno"
            r"|voto de (pesar|aplauso|repudio|congratulac|louvor)"  # votos cerimoniais
            r"|\bmocao\b"
            r"|requeiro|requer urgencia|retirada de tramitac"
        ),
    ),
    (
        "A2_Radiodifusao",
        re.compile(
            r"radiodifusao|\bretransmissao\b"
            r"|(renova|outorga|aprova o ato).{0,40}"
            r"(concessao|permissao|radiodifusao|emissora)"
        ),
    ),
    (
        "A1_Orcamentaria",
        re.compile(
            # abertura de crédito ao orçamento (verbo de abertura perto de "credito")
            r"(\babre\b|\babrir\b|\breabre\b|abertura de|reabertura de)\s+.{0,60}credito"
            # OU crédito qualificado em contexto explicitamente orçamentário
            r"|credito\s+(especial|suplementar|extraordinario)\b.{0,60}"
            r"(orcament|em favor de|no valor de|fiscal da uniao)"
        ),
    ),
]


def classificar_natureza(ementa: str) -> tuple[str, str]:
    """Classifica a ementa por natureza (Eixo A).

    Retorna ``(codigo, rotulo)`` onde ``codigo`` é um de
    ``A0_Administrativa | A1_Orcamentaria | A2_Radiodifusao | A3_Substantiva``
    e ``rotulo`` é o nome cidadão fixo da forma — ou ``None`` para A3, cujo
    rótulo só é definido no Eixo B.
    """
    if not ementa or not str(ementa).strip():
        # Sem texto não há como afirmar natureza de forma: trata como substantiva
        # (vai ao Eixo B, que descartará ementas vazias).
        return "A3_Substantiva", ROTULO_NATUREZA["A3_Substantiva"]

    texto = _norm(ementa)
    for codigo, padrao in REGRAS_NATUREZA:
        if padrao.search(texto):
            return codigo, ROTULO_NATUREZA[codigo]
    return "A3_Substantiva", ROTULO_NATUREZA["A3_Substantiva"]
