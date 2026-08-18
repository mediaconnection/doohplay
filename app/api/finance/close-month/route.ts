import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/require-super-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

// Achado na revisão do papel operador (10/07/2026): rota sem nenhuma
// autenticação — nem sessão, nem secret. Fechamento de mês é ação
// financeira irreversível (grava snapshot), mesma régua de finance/asaas.
//
// Achado na varredura ampla (17/08/2026, docs/achado-cpm-fixo-relatorio-
// financeiro.md): o snapshot é gravado com CPM fixo de R$25, sem relação
// com preço real cobrado por campanha. Confirmado com o fundador que
// monthly_financial_snapshots NÃO alimenta contabilidade real (é legado/
// interno) — por isso mantido como está, sem bloquear a rota. Se algum dia
// isso virar fonte de contabilidade de verdade, o cálculo abaixo precisa
// ser trocado por preço real por campanha antes de confiar no valor.
export async function POST(req: NextRequest) {
  if (!(await requireSuperAdmin(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { year, month } = await req.json()

  if (!year || !month) {
    return NextResponse.json(
      { error: "year e month são obrigatórios" },
      { status: 400 }
    )
  }

  // Import dinâmico — evita execução durante o build
  const { getPool } = await import("@/lib/db")
  const pool = getPool()

  const exists = await pool.query(
    `
    SELECT 1
    FROM monthly_financial_snapshots
    WHERE year = $1 AND month = $2
    LIMIT 1
    `,
    [year, month]
  )

  if ((exists.rowCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Mês já fechado" },
      { status: 409 }
    )
  }

  await pool.query(
    `
    INSERT INTO monthly_financial_snapshots (
      year, month,
      campaign_id, campaign_name,
      executions_done, total_seconds,
      cpm, gross_amount
    )
    SELECT
      $1, $2,
      c.id, c.name,
      COUNT(pl.id),
      COALESCE(SUM(pl.duration_seconds), 0),
      25.00,
      ROUND((COUNT(pl.id) / 1000.0) * 25.00, 2)
    FROM campaigns c
    LEFT JOIN play_logs_certified pl
      ON pl.campaign_id = c.id
     AND date_trunc('month', pl.started_at) = make_date($1, $2, 1)
    GROUP BY c.id, c.name
    `,
    [year, month]
  )

  return NextResponse.json({ success: true })
}