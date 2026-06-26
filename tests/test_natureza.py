"""Testes do Eixo A — classificação de natureza por regras.

Fixtures são ementas reais já verificadas na base (Senado), embutidas como
literais para que o teste rode offline, sem depender do Supabase. Os ids
externos estão nos comentários para rastreabilidade.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.classificacao.natureza import classificar_natureza

# (id_externo, natureza esperada, ementa real)
FIXTURES = [
    # 160579 — licença parlamentar
    (
        "160579",
        "A0_Administrativa",
        "Licença para tratar de interesses particulares",
    ),
    # 162175 — licença saúde (forma administrativa)
    (
        "162175",
        "A0_Administrativa",
        "Requer licença saúde de 6 (seis) dias a partir de 05/02/2024, conforme "
        "laudo da Junta Médica do Senado para concessão de licença para "
        "tratamento de saúde, em anexo.",
    ),
    # 158495 — requerimento de informação (forma, não tema de saúde)
    (
        "158495",
        "A0_Administrativa",
        "Requer que sejam prestadas, pela Senhora Ministra da Saúde, Nísia "
        "Trindade, informações sobre o andamento do processo de aprovação do "
        "protocolo clínico e das diretrizes terapêuticas da hipertensão pulmonar.",
    ),
    # 161455 — renovação de concessão de radiodifusão
    (
        "161455",
        "A2_Radiodifusao",
        "Aprova o ato que renova a concessão outorgada à TVSBT Canal 11 do Rio "
        "de Janeiro Ltda. para explorar serviço de radiodifusão de sons e "
        "imagens em tecnologia digital no Município do Rio de Janeiro, Estado "
        "do Rio de Janeiro.",
    ),
    # 166816 — renovação de concessão de radiodifusão
    (
        "166816",
        "A2_Radiodifusao",
        "Aprova o ato que renova a concessão outorgada à Televisão Independente "
        "de São José do Rio Preto Ltda. para explorar serviço de radiodifusão "
        "de sons e imagens no Município de São José do Rio Preto, Estado de "
        "São Paulo.",
    ),
    # 161774 — altera a Lei Orgânica da Saúde (substantiva → tema SUS no Eixo B)
    (
        "161774",
        "A3_Substantiva",
        "Altera a Lei nº 8.080, de 19 de setembro de 1990 (Lei Orgânica da "
        "Saúde), para determinar prazo máximo de cento e oitenta dias para a "
        "oferta, pelo SUS, de novos medicamentos, produtos e procedimentos.",
    ),
    # 165219 — CASO-CHAVE: "Acredita no Primeiro Passo" / microcrédito social.
    # Tem "crédito especial" (linha de crédito), mas NÃO é abertura orçamentária.
    # Princípio 3: microcrédito social != crédito orçamentário → permanece A3.
    (
        "165219",
        "A3_Substantiva",
        "Institui o Programa Acredita no Primeiro Passo e o Programa de "
        "Mobilização de Capital Privado Externo e Proteção Cambial - Programa "
        "Eco Invest Brasil; altera a Lei nº 13.999, de 18 de maio de 2020, "
        "para instituir o Programa de Crédito e Financiamento de Dívidas de "
        "Microempreendedores Individuais e Microempresas - Procred 360; cria "
        "linha de crédito especial para financiar a aquisição de veículos "
        "destinados à renovação da frota utilizada na prestação de serviços de "
        "táxi; e dá outras providências.",
    ),
]


@pytest.mark.parametrize("id_externo,esperado,ementa", FIXTURES)
def test_natureza_fixtures(id_externo, esperado, ementa):
    codigo, _ = classificar_natureza(ementa)
    assert codigo == esperado, f"{id_externo}: esperado {esperado}, obtido {codigo}"


def test_microcredito_nao_e_orcamentario():
    """O caso 165219 é o teste do princípio 3 — fica explícito e isolado."""
    codigo, _ = classificar_natureza(
        "cria linha de crédito especial para financiar a aquisição de veículos"
    )
    assert codigo == "A3_Substantiva"


def test_abertura_de_credito_e_orcamentario():
    """Abertura real de crédito ao orçamento deve ser A1."""
    codigo, rotulo = classificar_natureza(
        "Abre ao Orçamento Fiscal da União, em favor do Ministério da Justiça, "
        "crédito suplementar no valor de R$ 10.000.000,00."
    )
    assert codigo == "A1_Orcamentaria"
    assert rotulo == "Créditos Orçamentários"


def test_ementa_vazia_vira_substantiva():
    assert classificar_natureza("")[0] == "A3_Substantiva"
    assert classificar_natureza(None)[0] == "A3_Substantiva"


def test_a3_nao_tem_rotulo_fixo():
    """A3 delega o rótulo ao Eixo B (tema), então retorna None aqui."""
    _, rotulo = classificar_natureza("Altera o Código Penal para tipificar nova conduta.")
    assert rotulo is None
