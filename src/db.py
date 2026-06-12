"""
Cliente Supabase e helpers de upsert para o pipeline.
Usa a service role key — nunca expor no frontend.

Estratégia de idempotência sem `on_conflict` URL param
(incompatível com PostgREST 12.x do Supabase):
- parlamentares / proposicoes / votacoes: pré-busca IDs existentes e
  popula o campo `id` antes do upsert, que então resolve pelo PK.
- votos: delete-by-votacao_id + insert (idempotente e eficiente em lotes).
"""

import os
import logging
from typing import Any

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
log = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    """Retorna (ou cria) o cliente Supabase singleton."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client


# ------------------------------------------------------------------ #
# Helpers internos
# ------------------------------------------------------------------ #

def _paginar_select(tabela: str, colunas: str, lote: int = 1000) -> list[dict]:
    """Busca todos os registros de uma tabela paginando pelo range do PostgREST."""
    client = get_client()
    resultados = []
    offset = 0
    while True:
        resp = (
            client.table(tabela)
            .select(colunas)
            .range(offset, offset + lote - 1)
            .execute()
        )
        batch = resp.data or []
        resultados.extend(batch)
        if len(batch) < lote:
            break
        offset += lote
    return resultados


def _upsert_com_id(tabela: str, registros: list[dict], chave_fn) -> int:
    """
    Upsert genérico baseado no PK interno.
    chave_fn: função que recebe um registro existente e retorna a chave de lookup.
    Pré-busca IDs existentes e popula `id` nos registros antes do upsert.
    """
    if not registros:
        return 0
    client = get_client()

    # Pré-busca todos os IDs existentes
    existentes = _paginar_select(tabela, "id,id_externo,casa")
    mapa = {chave_fn(r): r["id"] for r in existentes}

    for r in registros:
        pk = chave_fn(r)
        if pk in mapa:
            r["id"] = mapa[pk]
        # sem `id` → INSERT; com `id` → UPDATE pelo PK

    lote = 500
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table(tabela).upsert(chunk).execute()
        total += len(chunk)
    return total


# ------------------------------------------------------------------ #
# Upserts públicos
# ------------------------------------------------------------------ #

def upsert_parlamentares(registros: list[dict]) -> int:
    """Insere ou atualiza parlamentares. Chave lógica: (id_externo, casa)."""
    total = _upsert_com_id(
        "parlamentares",
        registros,
        chave_fn=lambda r: (r["id_externo"], r["casa"]),
    )
    log.info("upsert parlamentares: %d registros", total)
    return total


def upsert_proposicoes(registros: list[dict]) -> int:
    """Insere ou atualiza proposições. Chave lógica: (id_externo, casa)."""
    if not registros:
        return 0
    client = get_client()

    existentes = _paginar_select("proposicoes", "id,id_externo,casa")
    mapa = {(r["id_externo"], r["casa"]): r["id"] for r in existentes}

    for r in registros:
        pk = (r["id_externo"], r["casa"])
        if pk in mapa:
            r["id"] = mapa[pk]

    lote = 500
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("proposicoes").upsert(chunk).execute()
        total += len(chunk)
        log.info("  proposicoes: %d/%d", total, len(registros))
    return total


def upsert_votacoes(registros: list[dict]) -> int:
    """Insere ou atualiza votações. Chave lógica: id_externo (alfanumérico)."""
    if not registros:
        return 0
    client = get_client()

    existentes = _paginar_select("votacoes", "id,id_externo")
    mapa = {r["id_externo"]: r["id"] for r in existentes}

    for r in registros:
        if r["id_externo"] in mapa:
            r["id"] = mapa[r["id_externo"]]

    lote = 500
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("votacoes").upsert(chunk).execute()
        total += len(chunk)
    log.info("upsert votacoes: %d registros", total)
    return total


def upsert_votos(registros: list[dict]) -> int:
    """
    Insere votos usando delete-then-insert por votacao_id.
    Garante idempotência sem depender de on_conflict composto.
    """
    if not registros:
        return 0
    client = get_client()

    # Coletar os votacao_ids afetados
    votacao_ids = list({r["votacao_id"] for r in registros})

    # Deletar votos existentes dessas votações em lotes de 100
    for i in range(0, len(votacao_ids), 100):
        chunk_ids = votacao_ids[i : i + 100]
        client.table("votos").delete().in_("votacao_id", chunk_ids).execute()

    # Inserir todos os votos em lotes de 1000
    lote = 1000
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("votos").insert(chunk).execute()
        total += len(chunk)

    log.info("upsert votos: %d registros", total)
    return total


# ------------------------------------------------------------------ #
# Helpers de leitura (usados no pipeline ML)
# ------------------------------------------------------------------ #

def buscar_todos(tabela: str, colunas: str = "*") -> list[dict]:
    """Retorna todos os registros de uma tabela com paginação automática."""
    return _paginar_select(tabela, colunas)


def buscar_id_interno(tabela: str, id_externo: int, casa: str) -> int | None:
    """Retorna o id interno a partir de (id_externo, casa)."""
    client = get_client()
    resp = (
        client.table(tabela)
        .select("id")
        .eq("id_externo", id_externo)
        .eq("casa", casa)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]["id"]
    return None


def buscar_id_votacao(id_externo_votacao: str) -> int | None:
    """Retorna o id interno de uma votação a partir do id_externo alfanumérico."""
    client = get_client()
    resp = (
        client.table("votacoes")
        .select("id")
        .eq("id_externo", id_externo_votacao)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]["id"]
    return None
