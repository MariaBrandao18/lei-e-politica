"""
Funções reutilizáveis de coleta para as APIs da Câmara e do Senado.
"""

import json
import time
import logging
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Optional

import requests
from requests.adapters import HTTPAdapter

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
# Sessão HTTP com keep-alive e pool de conexões
# ------------------------------------------------------------------ #
# Uma única Session reaproveita conexões TCP+TLS entre requisições
# (keep-alive), eliminando o handshake repetido a cada GET. O pool é
# dimensionado para suportar a coleta concorrente de votos.

_session: Optional[requests.Session] = None
_session_lock = threading.Lock()


def get_session() -> requests.Session:
    """Retorna (ou cria) a Session singleton, segura para uso concorrente."""
    global _session
    if _session is None:
        with _session_lock:
            if _session is None:
                s = requests.Session()
                adapter = HTTPAdapter(pool_connections=16, pool_maxsize=16)
                s.mount("https://", adapter)
                s.mount("http://", adapter)
                _session = s
    return _session


# ------------------------------------------------------------------ #
# Rate-limiter global (token mínimo entre requisições)
# ------------------------------------------------------------------ #
# Substitui o `time.sleep(0.3)` fixo após cada chamada. Garante um
# intervalo mínimo agregado entre QUALQUER requisição (mesmo com várias
# threads), respeitando a API sem serializar artificialmente cada GET.

class _RateLimiter:
    """Limita a taxa global de requisições com um intervalo mínimo."""

    def __init__(self, req_por_segundo: float):
        self._intervalo = 1.0 / req_por_segundo
        self._lock = threading.Lock()
        self._proximo = 0.0

    def aguardar(self) -> None:
        with self._lock:
            agora = time.monotonic()
            espera = self._proximo - agora
            if espera > 0:
                time.sleep(espera)
                agora = time.monotonic()
            self._proximo = agora + self._intervalo


# ~12 req/s no total — folgado para a API da Câmara e ainda assim
# muito mais rápido que o antigo sleep serial de 0,3s/request.
_rate_limiter = _RateLimiter(req_por_segundo=12.0)


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

    Usa a Session compartilhada (keep-alive) e respeita o rate-limiter
    global antes de cada tentativa.
    """
    ultimo_resp: Optional[requests.Response] = None
    ultimo_exc: Optional[Exception] = None
    sessao = get_session()

    for i in range(tentativas):
        _rate_limiter.aguardar()
        try:
            resp = sessao.get(url, params=params, headers=headers, timeout=30)
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
) -> list[dict]:
    """
    Itera todas as páginas de um endpoint da Câmara.
    Retorna lista achatada de itens.

    O ritmo entre requisições é controlado pelo rate-limiter global
    dentro de `_get_com_retry` — não há mais `sleep` fixo por página.
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

    return resultados


# ------------------------------------------------------------------ #
# Coleta concorrente de votos nominais — API da Câmara
# ------------------------------------------------------------------ #

def coletar_votos_camara(
    votacoes_ids: list[str],
    max_workers: int = 8,
) -> dict[str, list[dict]]:
    """
    Busca `/votacoes/{id}/votos` para vários ids em paralelo.

    Substitui o loop serial (1 GET por votação + sleep). Reaproveita a
    Session compartilhada (keep-alive) e o rate-limiter global, então a
    taxa agregada permanece sob controle mesmo com várias threads.

    Retorna um dict {id_votacao -> lista de votos}. Votações cuja
    requisição falhou (status != 200) são omitidas do dict; votações
    simbólicas (sem votos nominais) aparecem com lista vazia, cabendo ao
    chamador descartá-las.
    """
    resultados: dict[str, list[dict]] = {}

    def _buscar(vid: str) -> tuple[str, Optional[list[dict]]]:
        url = f"{BASE_CAMARA}/votacoes/{vid}/votos"
        resp = _get_com_retry(url)
        if resp.status_code != 200:
            return vid, None
        return vid, resp.json().get("dados", [])

    total = len(votacoes_ids)
    concluidas = 0
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futuros = {executor.submit(_buscar, vid): vid for vid in votacoes_ids}
        for fut in as_completed(futuros):
            vid, votos = fut.result()
            if votos is not None:
                resultados[vid] = votos
            concluidas += 1
            if concluidas % 200 == 0:
                log.info("Votos coletados: %d/%d votações", concluidas, total)

    log.info("Coleta concorrente concluída: %d/%d votações com resposta", len(resultados), total)
    return resultados


# ------------------------------------------------------------------ #
# Paginação — API do Senado
# ------------------------------------------------------------------ #

def get_senado(
    endpoint: str,
    params: Optional[dict] = None,
) -> Any:
    """
    GET simples na API do Senado (sem paginação uniforme).
    Retorna o JSON completo já parseado.

    O ritmo é controlado pelo rate-limiter global em `_get_com_retry`.
    """
    url = f"{BASE_SENADO}/{endpoint}"
    headers = {"Accept": "application/json"}
    resp = _get_com_retry(url, params=params, headers=headers)

    if resp.status_code != 200:
        log.error("Falha permanente em %s: HTTP %s", url, resp.status_code)
        return None

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
