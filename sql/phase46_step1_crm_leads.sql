-- Fase 46 (17/08/2026) — CRM de leads persistido no banco.
-- Achado na varredura ampla (docs/relatorio-varredura-ampla-17-08-2026.md):
-- app/crm/page.tsx guardava os leads só no localStorage do navegador —
-- não compartilhado entre a equipe, perdido se limpar o cache do
-- navegador, sem backup. Colunas espelham exatamente o tipo `Lead` já
-- existente no front (app/crm/page.tsx), pra troca de localStorage por
-- API ser 1:1, sem precisar mudar o resto da tela (kanban, filtros, CSV).
CREATE TABLE IF NOT EXISTS crm_leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  business_type TEXT        NOT NULL DEFAULT 'Outro',
  city          TEXT        NOT NULL DEFAULT 'São Paulo',
  phone         TEXT        NOT NULL DEFAULT '',
  contact_name  TEXT        NOT NULL DEFAULT '',
  stage         TEXT        NOT NULL DEFAULT 'contato',
  notes         TEXT        NOT NULL DEFAULT '',
  last_contact  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads (stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads (created_at DESC);
