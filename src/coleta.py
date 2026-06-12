"""
Funções reutilizáveis de coleta para as APIs da Câmara e do Senado.
"""

import json
import time
import logging
from pathlib import Path
from typing import Any, Optional

import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

BASE_CAMARA = "https://dadosabertos.camara.leg.br/api/v2"
BASE_SENADO = "https://legis.senado.leg.br/dadosabertos"
RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ #
# Utilitários de HTTP
# ------------------------------------------------------------------ #

def _get_com_retry(
    url: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    tentativas: int = 3,
    backoff: float = 5.0,
) -> requests.Response:
    """
    GET com retry em erros 5xx e timeout.
    Retorna a última resposta recebida (mesmo que seja 5xx) para que
    o chamador decida o que fazer — nunca levanta HTTPError sozinho.
    Levanta ConnectionError apenas se TODAS as tentativas falharam
    por exceção de rede (sem resposta HTTP alguma).
    """
    ultimo_resp: Optional[requests.Response] = None
    ultimo_exc: Optional[Exception] = None

    for i in range(tentativas):
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=30)
            ultimo_resp = resp
            if resp.status_code < 500:
                return resp
            log.warning(
                "HTTP %s em %s (tentativa %d/%d)",
                resp.status_code, url, i + 1, tentativas,
            )
        except requests.RequestException as exc:
            ultimo_exc = exc
            log.warning(
                "Erro de conexão em %s: %s (tentativa %d/%d)",
                url, exc, i + 1, tentativas,
            )
        if i < tentativas - 1:
            espera = backoff * (i + 1)
            log.info("Aguardando %.0fs antes de tentar novamente...", espera)
            time.sleep(espera)

    if ultimo_resp is not None:
        return ultimo_resp  # 5xx — chamador trata com status_code != 200
    raise requests.ConnectionError(
        f"Todas as {tentativas} tentativas falharam sem resposta HTTP: {ultimo_exc}"
    )


# ------------------------------------------------------------------ #
# Paginação — API da Câmara
# ------------------------------------------------------------------ #

def paginar_camara(
    endpoint: str,
    params: Optional[dict] = None,
    tamanho: int = 100,
    delay: float = 0.3,
) -> list[dict]:
    """
    Itera todas as páginas de um endpoint da Câmara.
    Retorna lista achatada de itens.
    """
    params = dict(params or {})
    params["itens"] = tamanho
    pagina = 1
    resultados: list[dict] = []

    while True:
        params["pagina"] = pagina
        url = f"{BASE_CAMARA}/{endpoint}"
        resp = _get_com_retry(url, params=params)

        if resp.status_code != 200:
            log.error("Falha permanente em %s: HTTP %s", url, resp.status_code)
            break

        dados = resp.json().get("dados", [])
        if not dados:
            break

        resultados.extend(dados)
        log.info("  %s — página %d → %d itens acumulados", endpoint, pagina, len(resultados))
        pagina += 1
        time.sleep(delay)

    return resultados


# ------------------------------------------------------------------ #
# Paginação — API do Senado
# ------------------------------------------------------------------ #

def get_senado(
    endpoint: str,
    params: Optional[dict] = None,
    delay: float = 0.3,
) -> Any:
    """
    GET simples na API do Senado (sem paginação uniforme).
    Retorna o JSON completo já parseado.
    """
    url = f"{BASE_SENADO}/{endpoint}"
    headers = {"Accept": "application/json"}
    resp = _get_com_retry(url, params=params, headers=headers)

    if resp.status_code != 200:
        log.error("Falha permanente em %s: HTTP %s", url, resp.status_code)
        return None

    time.sleep(delay)
    return resp.json()


# ------------------------------------------------------------------ #
# Normalização de tipoVoto
# ------------------------------------------------------------------ #

MAPA_VOTO = {
    "Sim": "favoravel",
    "sim": "favoravel",
    "SIM": "favoravel",
    "Não": "contrario",
    "não": "contrario",
    "NÃO": "contrario",
    "Nao": "contrario",
    "NAO": "contrario",
    "Abstenção": "abstencao",
    "Abstenção ": "abstencao",
    "Obstrução": "abstencao",
    "Artigo 17": "abstencao",
}


def normalizar_voto(tipo_voto: str) -> Optional[str]:
    """
    Converte o tipoVoto bruto da API para o enum do banco.
    Retorna None para valores não mapeados (logar externamente).
    """
    return MAPA_VOTO.get(str(tipo_voto).strip())


# ------------------------------------------------------------------ #
# Persistência em data/raw/
# ------------------------------------------------------------------ #

def salvar_raw(nome_arquivo: str, dados: Any) -> Path:
    """Salva dados brutos em JSON em data/raw/."""
    caminho = RAW_DIR / nome_arquivo
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    log.info("Salvo: %s (%d registros)", caminho, len(dados) if isinstance(dados, list) else 1)
    return caminho


def carregar_raw(nome_arquivo: str) -> Any:
    """Carrega JSON de data/raw/."""
    caminho = RAW_DIR / nome_arquivo
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)
