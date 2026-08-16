// app/api/admin/feature-flags/route.ts
// Fase 45 (16/08/2026) — CRUD genérico de feature flags por cliente. Ver
// docs/dtv-ready-mvp-plano.md e docs/api-contract.md. Primeira chave
// usada: 'dtv_ready'. flag_key é validado contra allowlist aqui, nunca
// aceito livre do body — mesmo padrão já usado em widget_layout_mode/
// widget_position (app/api/admin/screen-templates/route.ts).
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getPool } from "@/lib/db"

export const dynamic = "force-dynamic"

// Allowlist de flag_key conhecidas — adicionar aqui ao introduzir uma
// nova feature flag no produto.
const KNOWN_FLAG_KEYS = ["dtv_ready"] as const
type FlagKey = (typeof KNOWN_FLAG_KEYS)[number]

async function checkAuth(req: NextRequest) {
  const session = await getServerSession()
  const secret = req.nextUrl.searchParams.get("secret")
  return !!session?.user || (secret && secret === process.env.ADMIN_SECRET)
}

// GET — lista flags. Sem query param: todas. Com ?client_code=X: só as
// desse cliente.
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const pool = getPool()
  const clientCode = req.nextUrl.searchParams.get("client_code")
  try {
    const { rows } = clientCode
      ? await pool.query(
          `SELECT client_code, flag_key, enabled, metadata, updated_at FROM feature_flags WHERE client_code = $1 ORDER BY flag_key`,
          [clientCode.toUpperCase()]
        )
      : await pool.query(
          `SELECT client_code, flag_key, enabled, metadata, updated_at FROM feature_flags ORDER BY client_code, flag_key`
        )
    return NextResponse.json({ count: rows.length, items: rows })
  } catch (err: any) {
    // Migração sql/phase45_step1_feature_flags.sql pode não ter rodado
    // ainda nesse ambiente — responde vazio em vez de 500, consistente
    // com o resto do produto tratando essa feature como opcional/aditiva.
    console.error("[admin/feature-flags GET]", err)
    return NextResponse.json({ count: 0, items: [], warning: "feature_flags indisponível — migração Fase 45 pendente?" })
  }
}

// POST — cria/atualiza uma flag pra um cliente.
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    const clientCode = String(body.client_code || "").toUpperCase()
    const flagKey = String(body.flag_key || "") as FlagKey
    const enabled = body.enabled === true

    if (!clientCode) return NextResponse.json({ error: "client_code é obrigatório" }, { status: 400 })
    if (!KNOWN_FLAG_KEYS.includes(flagKey)) {
      return NextResponse.json({ error: `flag_key inválido. Valores aceitos: ${KNOWN_FLAG_KEYS.join(", ")}` }, { status: 400 })
    }

    const pool = getPool()
    const res = await pool.query(
      `INSERT INTO feature_flags (client_code, flag_key, enabled, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (client_code, flag_key)
       DO UPDATE SET enabled = $3, updated_at = NOW()
       RETURNING client_code, flag_key, enabled, updated_at`,
      [clientCode, flagKey, enabled]
    )
    return NextResponse.json({ ok: true, ...res.rows[0] })
  } catch (err: any) {
    console.error("[admin/feature-flags POST]", err)
    return NextResponse.json({ error: err.message || "Erro interno — migração Fase 45 (feature_flags) pode estar pendente" }, { status: 500 })
  }
}
