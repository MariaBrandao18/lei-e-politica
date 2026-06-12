"""
Cliente Supabase e helpers de upsert para o pipeline.
Usa a service role key — nunca expor no frontend.
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

def _dedup(registros: list[dict], *chaves: str) -> list[dict]:
    """Remove duplicatas mantendo o último registro por chave composta."""
    vistos: dict = {}
    for r in registros:
        k = tuple(r[c] for c in chaves)
        vistos[k] = r
    return list(vistos.values())


def _paginar_select(tabela: str, colunas: str, lote: int = 1000) -> list[dict]:
    """Busca todos os registros paginando via range do PostgREST."""
    client = get_client()
    resultados: list[dict] = []
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


# ------------------------------------------------------------------ #
# Upserts públicos
# ------------------------------------------------------------------ #

def upsert_parlamentares(registros: list[dict]) -> int:
    """Insere ou atualiza parlamentares. Chave lógica: (id_externo, casa)."""
    if not registros:
        return 0
    unicos = _dedup(registros, "id_externo", "casa")
    client = get_client()
    client.table("parlamentares").upsert(
        unicos, on_conflict="id_externo,casa"
    ).execute()
    log.info("upsert parlamentares: %d registros", len(unicos))
    return len(unicos)


def upsert_proposicoes(registros: list[dict]) -> int:
    """Insere ou atualiza proposições. Chave lógica: (id_externo, casa)."""
    if not registros:
        return 0
    unicos = _dedup(registros, "id_externo", "casa")
    client = get_client()
    lote = 500
    total = 0
    for i in range(0, len(unicos), lote):
        chunk = unicos[i : i + lote]
        client.table("proposicoes").upsert(
            chunk, on_conflict="id_externo,casa"
        ).execute()
        total += len(chunk)
        log.info("  proposicoes: %d/%d", total, len(unicos))
    return total


def upsert_votacoes(registros: list[dict]) -> int:
    """Insere ou atualiza votações. Chave lógica: id_externo (alfanumérico)."""
    if not registros:
        return 0
    unicos = _dedup(registros, "id_externo")
    client = get_client()
    lote = 500
    total = 0
    for i in range(0, len(unicos), lote):
        chunk = unicos[i : i + lote]
        client.table("votacoes").upsert(
            chunk, on_conflict="id_externo"
        ).execute()
        total += len(chunk)
    log.info("upsert votacoes: %d registros", total)
    return total


def upsert_votos(registros: list[dict]) -> int:
    """
    Insere votos. Usa delete-then-insert por votacao_id para evitar
    dependência de on_conflict composto com FKs, que é frágil em
    PostgREST quando os IDs são gerados pelo banco.
    """
    if not registros:
        return 0
    client = get_client()

    votacao_ids = list({r["votacao_id"] for r in registros})
    for i in range(0, len(votacao_ids), 100):
        client.table("votos").delete().in_("votacao_id", votacao_ids[i : i + 100]).execute()

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
    return resp.data[0]["id"] if resp.data else None


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
    return resp.data[0]["id"] if resp.data else None
