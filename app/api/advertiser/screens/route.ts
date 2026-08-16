// app/api/advertiser/screens/route.ts
// Lista as telas REAIS disponíveis para um anunciante escolher ao criar uma
// campanha — substitui a lista fake de shoppings (sp-01, rj-01 etc.) que
// existia antes só como dado de demonstração.
import { getPool } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const pool = getPool()
  try {
    // UPPER(code) — studio_clients.code não é garantidamente maiúsculo no
    // banco (mesmo motivo pelo qual outras rotas comparam com
    // UPPER(code) = UPPER($1), ver app/dashboard/local/[code]/page.tsx e
    // app/player/page.tsx). feature_flags.client_code é sempre gravado em
    // maiúsculo (app/api/admin/feature-flags/route.ts faz .toUpperCase()),
    // então sem esse UPPER() aqui o dtvReadyCodes.has(s.id) abaixo nunca
    // batia — bug encontrado no smoke test de 16/08/2026 (flag ativada no
    // admin pra BARBE332, mas /api/advertiser/screens continuava
    // retornando dtv_ready: false).
    const { rows } = await pool.query(`
      SELECT UPPER(code) AS id, name, city, business_type, screen_size, price_multiplier, screen_orientation
      FROM studio_clients
      WHERE active = true
      ORDER BY city ASC NULLS LAST, name ASC
    `)

    // Fase 45 (16/08/2026): selo "TV 3.0 Ready" (dtv_ready), ver
    // docs/dtv-ready-mvp-plano.md. Query separada e com try/catch próprio
    // — se a migração sql/phase45_step1_feature_flags.sql ainda não rodou
    // nesse ambiente, a lista de telas continua funcionando normalmente,
    // só sem o selo.
    let dtvReadyCodes = new Set<string>()
    try {
      const dtvRes = await pool.query(
        `SELECT client_code FROM feature_flags WHERE flag_key = 'dtv_ready' AND enabled = true`
      )
      dtvReadyCodes = new Set(dtvRes.rows.map((r: any) => r.client_code))
    } catch {}

    const screens = rows.map((s: any) => ({ ...s, dtv_ready: dtvReadyCodes.has(s.id) }))
    return Response.json({ screens })
  } catch (err) {
    console.error("[advertiser/screens GET]", err)
    return Response.json({ screens: [], error: String(err) }, { status: 500 })
  }
}
