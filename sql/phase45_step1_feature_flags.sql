-- Fase 45 (16/08/2026) — tabela genérica de feature flags por cliente.
-- Primeira chave usada: 'dtv_ready' (Fase "TV 3.0 Ready", ver
-- docs/dtv-ready-mvp-plano.md e docs/api-contract.md).
-- Genérica de propósito: evita criar coluna nova em screen_templates a
-- cada feature flag futura. flag_key é validado contra allowlist no
-- backend (app/api/admin/feature-flags/route.ts), nunca aceito livre do
-- client.
CREATE TABLE IF NOT EXISTS feature_flags (
  id SERIAL PRIMARY KEY,
  client_code TEXT NOT NULL,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_code, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_client_code ON feature_flags (client_code);
