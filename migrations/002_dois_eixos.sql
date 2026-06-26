-- Migration 002 — Classificação em dois eixos (Sprint 2, redesign de clusterização)
-- Idempotente. Executar no Supabase SQL Editor OU via apply_migration.

-- Eixo A (natureza, regras) e marcação de qual eixo definiu o tema_cidadao.
ALTER TABLE proposicoes
  ADD COLUMN IF NOT EXISTS natureza_codigo  text,   -- A0_Administrativa | A1_Orcamentaria | A2_Radiodifusao | A3_Substantiva
  ADD COLUMN IF NOT EXISTS eixo             text;   -- 'forma' (A0/A1/A2) | 'tema' (A3)

-- A partir daqui:
--   tema_cluster  é preenchido SOMENTE para A3_Substantiva (NULL nas demais).
--   tema_cidadao  é o rótulo final unificado: nome da forma (A0/A1/A2)
--                 OU nome do tema descoberto no Eixo B (A3).

CREATE INDEX IF NOT EXISTS idx_proposicoes_natureza ON proposicoes (natureza_codigo);
CREATE INDEX IF NOT EXISTS idx_proposicoes_eixo      ON proposicoes (eixo);
