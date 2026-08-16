// app/dashboard/local/[code]/page.tsx
export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getPool } from "@/lib/db"
import { verifyClientSessionToken, CLIENT_SESSION_COOKIE } from "@/lib/client-session"
import DashboardClient from "./dashboard-client"
import ClientLoginGate from "./client-login-gate"

export type ClientData = {
  id: string
  code: string
  name: string
  business_type: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  cpf_cnpj: string | null
  player_id: string | null
  logo_url: string | null
  primary_color: string | null
}

export type PlayerData = {
  id: string
  name: string | null
  location: string | null
  device_type: string | null
  platform: string | null
  last_ping: string | null
  online: boolean
  sla_30d: number
}

export type StatsData = {
  plays_today: number
  plays_month: number
  revenue_today: number
  revenue_month: number
}

export type PlaylistItem = {
  id: string
  type: string
  duration: number
  position: number
  asset_url: string | null
  name?: string
  screen_id?: string | null
}

export type Payment = {
  id: string
  value: number
  status: string
  paid_at: string | null
  created_at: string
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const pool = getPool()

  // Achado numa revisão de segurança (11/07/2026): esta página buscava
  // cpf_cnpj/email/telefone direto do banco no servidor, antes de qualquer
  // checagem de sessão — o dado sensível já saía no HTML mesmo que a UI
  // "escondesse" atrás de uma tela de login em React. A proteção de
  // verdade tem que estar aqui, antes da primeira query sensível.
  const upperCode = code.toUpperCase()
  const existsRes = await pool.query(
    `SELECT code, name FROM studio_clients WHERE UPPER(code) = $1 AND active = true LIMIT 1`,
    [upperCode]
  )
  if (!existsRes.rows[0]) return notFound()

  const cookieStore = await cookies()
  const sessionCode = verifyClientSessionToken(cookieStore.get(CLIENT_SESSION_COOKIE)?.value)
  if (sessionCode !== upperCode) {
    return <ClientLoginGate code={upperCode} clientName={existsRes.rows[0].name} />
  }

  // 1. Busca cliente
  const clientRes = await pool.query(
    `SELECT id::text, code, name, business_type, address, city,
            phone, email, cpf_cnpj, player_id::text,
            logo_url, primary_color
     FROM studio_clients
     WHERE UPPER(code) = UPPER($1)
     LIMIT 1`,
    [code]
  )

  if (!clientRes.rows[0]) return notFound()
  const client: ClientData = clientRes.rows[0]

  // 2. Busca player (se tiver player_id)
  let player: PlayerData | null = null
  if (client.player_id) {
    try {
      const playerRes = await pool.query(
        `SELECT
           p.id::text,
           p.name,
           p.location,
           p.device_type,
           p.platform,
           p.last_ping::text,
           CASE
             WHEN p.last_ping IS NOT NULL
               AND (NOW() - p.last_ping) < INTERVAL '3 minutes'
             THEN true
             ELSE false
           END AS online,
           (SELECT COUNT(*)::float / 30 * 100
              FROM player_heartbeats ph
              WHERE ph.player_id = p.id
                AND ph.last_seen_at > NOW() - INTERVAL '30 days'
                AND ph.status = 'online'
           ) AS sla_30d
         FROM players p
         WHERE p.id = $1::uuid
         LIMIT 1`,
        [client.player_id]
      )
      if (playerRes.rows[0]) player = playerRes.rows[0]
    } catch {}
  }

  // 3. Stats
  let stats: StatsData = { plays_today: 0, plays_month: 0, revenue_today: 0, revenue_month: 0 }
  if (client.player_id) {
    try {
      const statsRes = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE played_at::date = CURRENT_DATE)::int        AS plays_today,
           COUNT(*) FILTER (WHERE played_at >= date_trunc('month', NOW()))::int AS plays_month
         FROM display_events
         WHERE player_id = $1::uuid`,
        [client.player_id]
      )
      if (statsRes.rows[0]) {
        stats.plays_today  = statsRes.rows[0].plays_today  ?? 0
        stats.plays_month  = statsRes.rows[0].plays_month  ?? 0
      }
    } catch {}

    // Revenue real de anúncios de terceiros — soma de pagamentos confirmados
    // no mês corrente via proof_of_play + campanhas pagas. Enquanto não há
    // anunciantes reais, retorna 0 corretamente (antes buscava o valor da
    // assinatura, que induzia o cliente a erro).
    try {
      const revRes = await pool.query(
        `SELECT COALESCE(SUM(cp.amount), 0)::float AS revenue_month
         FROM campaign_payments cp
         JOIN "Campaign" c ON c.id = cp.campaign_id
         WHERE c."advertiserCode" = $1
           AND cp.status = 'confirmed'
           AND cp.paid_at >= date_trunc('month', NOW())`,
        [code]
      )
      if (revRes.rows[0]) {
        stats.revenue_month = revRes.rows[0].revenue_month ?? 0
        stats.revenue_today = Math.round((stats.revenue_month / 30) * 100) / 100
      }
    } catch {
      // tabela campaign_payments pode não existir ainda — mantém zero
      stats.revenue_month = 0
      stats.revenue_today = 0
    }
  }

  // 4. Playlist — Achado em produção (16/07/2026): esta query lia de
  // CampaignMedia via Campaign.advertiserCode, tratando o CÓDIGO DO DONO
  // como se fosse um "código de anunciante" — funcionava só por acidente,
  // enquanto existia uma Campaign com advertiserCode = código do dono (like
  // aconteceu com BARBE332, cadastrado por engano também como anunciante).
  // A rota real que o player usa (/api/client/playlist/[code]) já migrou pra
  // fundação unificada (creative_assets_v2/placements_v2) há muito tempo —
  // essa aqui, que alimenta a aba "Conteúdo" do dashboard, nunca foi
  // atualizada junto, e ficava mostrando vazio pro dono assim que ele não
  // tivesse mais (ou nunca tivesse tido) uma Campaign própria. Mesma classe
  // de bug já corrigida hoje em outros 6+ lugares — dois caminhos paralelos
  // pra mesma informação, divergindo silenciosamente.
  let playlist: PlaylistItem[] = []
  try {
    const plRes = await pool.query(
      `SELECT
         ca.source_id::text AS id,
         ca.type,
         COALESCE(ca.duration_seconds, 15) AS duration,
         COALESCE(p.position,
           ROW_NUMBER() OVER (ORDER BY ca.created_at ASC)::int) AS position,
         ca.url            AS asset_url,
         ca.name,
         p.screen_id::text AS screen_id
       FROM placements_v2 p
       JOIN creative_assets_v2 ca ON ca.id = p.creative_asset_id
       JOIN campaigns_v2 cv ON cv.id = ca.campaign_id
       WHERE cv.owner_type = 'dono' AND cv.owner_code = UPPER($1)
       ORDER BY COALESCE(p.position, 999), ca.created_at ASC
       LIMIT 20`,
      [code]
    )
    playlist = plRes.rows
  } catch {}

  // 5. Payments
  let payments: Payment[] = []
  try {
    const payRes = await pool.query(
      `SELECT id::text, value::float, status,
              paid_at::text, created_at::text
       FROM client_payments
       WHERE code = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [code]
    )
    payments = payRes.rows
  } catch {}

  // 6. Feature flag "TV 3.0 Ready" (Fase 45, 16/08/2026) — ver
  // docs/dtv-ready-mvp-plano.md e docs/api-contract.md. Mesmo padrão
  // try/catch das outras queries desta página: se a migração
  // sql/phase45_step1_feature_flags.sql ainda não rodou nesse ambiente,
  // cai em false e o dashboard segue exatamente como sempre.
  let dtvReady = false
  try {
    const dtvRes = await pool.query(
      `SELECT enabled FROM feature_flags WHERE client_code = $1 AND flag_key = 'dtv_ready' LIMIT 1`,
      [upperCode]
    )
    dtvReady = dtvRes.rows[0]?.enabled === true
  } catch {}

  return (
    <DashboardClient
      client={client}
      player={player}
      stats={stats}
      playlist={playlist}
      payments={payments}
      dtvReady={dtvReady}
    />
  )
}
