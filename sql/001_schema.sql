-- Schema Lei e Política — v1
-- Executar no Supabase SQL Editor

-- IDs externos da Câmara e do Senado podem colidir;
-- toda entidade multi-casa usa chave interna + (id_externo, casa) único.

CREATE TABLE IF NOT EXISTS parlamentares (
  id            SERIAL PRIMARY KEY,
  id_externo    INTEGER NOT NULL,
  casa          TEXT NOT NULL CHECK (casa IN ('camara', 'senado')),
  nome          TEXT NOT NULL,
  partido       TEXT,
  uf            TEXT,
  foto_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (id_externo, casa)
);

CREATE TABLE IF NOT EXISTS proposicoes (
  id            SERIAL PRIMARY KEY,
  id_externo    INTEGER NOT NULL,
  casa          TEXT NOT NULL CHECK (casa IN ('camara', 'senado')),
  ementa        TEXT,
  keywords      TEXT,
  data          DATE,
  tema_cluster  INTEGER,        -- resultado do K-Means (Sprint 2)
  tema_cidadao  TEXT,           -- nome em linguagem cidadã (Sprint 2)
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (id_externo, casa)
);

CREATE TABLE IF NOT EXISTS votacoes (
  id              SERIAL PRIMARY KEY,
  id_externo      TEXT NOT NULL UNIQUE,   -- IDs da Câmara são alfanuméricos
  proposicao_id   INTEGER REFERENCES proposicoes(id),
  data            DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votos (
  id              SERIAL PRIMARY KEY,
  votacao_id      INTEGER REFERENCES votacoes(id),
  parlamentar_id  INTEGER REFERENCES parlamentares(id),
  voto            TEXT CHECK (voto IN ('favoravel', 'contrario', 'abstencao')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (votacao_id, parlamentar_id)     -- deduplicação
);

-- Perfil descritivo por parlamentar+tema (calculado no Sprint 3, exibido no frontend)
CREATE TABLE IF NOT EXISTS perfil_parlamentar (
  id              SERIAL PRIMARY KEY,
  parlamentar_id  INTEGER REFERENCES parlamentares(id),
  tema_cidadao    TEXT,
  pct_favoravel   NUMERIC(5,2),
  total_votacoes  INTEGER,
  postura_geral   TEXT CHECK (postura_geral IN ('favoravel', 'neutro', 'contrario')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (parlamentar_id, tema_cidadao)
);

-- Resultados do modelo supervisionado (transparência metodológica)
CREATE TABLE IF NOT EXISTS metricas_modelo (
  id              SERIAL PRIMARY KEY,
  modelo          TEXT,               -- ex: 'random_forest_v1'
  acuracia        NUMERIC(5,4),
  f1_macro        NUMERIC(5,4),
  data_corte      DATE,               -- limite do split temporal
  n_treino        INTEGER,
  n_teste         INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE parlamentares ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_parlamentar ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_modelo ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas nas tabelas do frontend
CREATE POLICY "leitura_publica_parlamentares"
  ON parlamentares FOR SELECT TO anon USING (true);

CREATE POLICY "leitura_publica_perfil"
  ON perfil_parlamentar FOR SELECT TO anon USING (true);

CREATE POLICY "leitura_publica_metricas"
  ON metricas_modelo FOR SELECT TO anon USING (true);

-- Demais tabelas: sem política pública (service role acessa sem RLS)
