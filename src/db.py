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
# Helpers de upsert
# ------------------------------------------------------------------ #

def upsert_parlamentares(registros: list[dict]) -> int:
    """
    Insere ou atualiza parlamentares.
    Chave de conflito: (id_externo, casa).
    """
    if not registros:
        return 0
    client = get_client()
    client.table("parlamentares").upsert(
        registros,
        on_conflict="id_externo,casa",
    ).execute()
    log.info("upsert parlamentares: %d registros", len(registros))
    return len(registros)


def upsert_proposicoes(registros: list[dict]) -> int:
    """
    Insere ou atualiza proposições.
    Chave de conflito: (id_externo, casa).
    """
    if not registros:
        return 0
    client = get_client()
    # Supabase upsert em lotes de 500 para evitar payload muito grande
    lote = 500
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("proposicoes").upsert(
            chunk,
            on_conflict="id_externo,casa",
        ).execute()
        total += len(chunk)
        log.info("  proposicoes: %d/%d inseridas", total, len(registros))
    return total


def upsert_votacoes(registros: list[dict]) -> int:
    """
    Insere ou atualiza votações.
    Chave de conflito: id_externo.
    """
    if not registros:
        return 0
    client = get_client()
    lote = 500
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("votacoes").upsert(
            chunk,
            on_conflict="id_externo",
        ).execute()
        total += len(chunk)
    log.info("upsert votacoes: %d registros", total)
    return total


def upsert_votos(registros: list[dict]) -> int:
    """
    Insere ou atualiza votos.
    Chave de conflito: (votacao_id, parlamentar_id) — requer IDs internos.
    """
    if not registros:
        return 0
    client = get_client()
    lote = 1000
    total = 0
    for i in range(0, len(registros), lote):
        chunk = registros[i : i + lote]
        client.table("votos").upsert(
            chunk,
            on_conflict="votacao_id,parlamentar_id",
        ).execute()
        total += len(chunk)
    log.info("upsert votos: %d registros", total)
    return total


# ------------------------------------------------------------------ #
# Helpers de leitura (usados no pipeline ML)
# ------------------------------------------------------------------ #

def buscar_todos(tabela: str, colunas: str = "*") -> list[dict]:
    """Retorna todos os registros de uma tabela (sem paginação extra)."""
    client = get_client()
    resp = client.table(tabela).select(colunas).execute()
    return resp.data


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
