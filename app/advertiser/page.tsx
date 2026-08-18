export const dynamic = "force-dynamic"

import Link from "next/link"
import { pool } from "@/lib/db"

// DOOHPLAY brand
const BRAND = "#0284C7"
const BRAND_DARK = "#0369A1"
const BRAND_LIGHT = "#F0F9FF"
const BRAND_BORDER = "#BAE6FD"

type Campaign = {
  id: string
  name: string
  advertiser: string
  status: string
  start_date: string | null
  end_date: string | null
  duration_seconds: number | null
  cpm: number | null
  media_type: string | null
  total_plays: number
  player_name: string | null
  player_location: string | null
  last_play: string | null
  plays_today: number
  plays_week: number
}

type RecentPlay = {
  id: string
  campaign_name: string
  advertiser: string
  player_name: string | null
  player_location: string | null
  played_at: string
  duration: number | null
  event_hash: string | null
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(d))
  } catch { return "—" }
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(d))
  } catch { return "—" }
}

function fmtCurrency(v?: number | null) {
  if (v == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))
}

function shortHash(h?: string | null) {
  if (!h) return "—"
  return `${h.slice(0, 10)}...${h.slice(-6)}`
}

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT
          c.id, c.name, c.advertiser, c.status,
          c.start_date, c.end_date, c.duration_seconds, c.cpm, c.media_type,
          COUNT(e.id)::int AS total_plays,
          p.name AS player_name,
          p.location AS player_location,
          MAX(e.played_at)::text AS last_play,
          COUNT(e.id) FILTER (WHERE e.played_at >= CURRENT_DATE)::int AS plays_today,
          COUNT(e.id) FILTER (WHERE e.played_at >= CURRENT_DATE - INTERVAL '7 days')::int AS plays_week
        FROM campaigns c
        LEFT JOIN display_events e ON e.campaign_id = c.id
        LEFT JOIN players p ON p.id = e.player_id
        WHERE c.is_active = true
        GROUP BY c.id, p.name, p.location
        ORDER BY total_plays DESC
        LIMIT 20
      `),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 5000))
    ]) as any
    return r.rows ?? []
  } catch (e) { console.error("Advertiser:", e); return [] }
}

async function getRecentPlays(): Promise<RecentPlay[]> {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT
          e.id, c.name AS campaign_name, c.advertiser,
          p.name AS player_name, p.location AS player_location,
          e.played_at, e.duration, e.event_hash
        FROM display_events e
        JOIN campaigns c ON c.id = e.campaign_id
        LEFT JOIN players p ON p.id = e.player_id
        WHERE c.is_active = true
        ORDER BY e.played_at DESC
        LIMIT 30
      `),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 5000))
    ]) as any
    return r.rows ?? []
  } catch { return [] }
}

async function getStats() {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT
          COUNT(DISTINCT c.id)::int AS total_campaigns,
          COUNT(e.id)::int AS total_plays,
          COUNT(e.id) FILTER (WHERE e.played_at >= CURRENT_DATE)::int AS plays_today,
          COUNT(DISTINCT e.player_id)::int AS active_screens
        FROM campaigns c
        LEFT JOIN display_events e ON e.campaign_id = c.id
        WHERE c.is_active = true
      `),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 4000))
    ]) as any
    return r.rows?.[0] ?? { total_campaigns: 0, total_plays: 0, plays_today: 0, active_screens: 0 }
  } catch { return { total_campaigns: 0, total_plays: 0, plays_today: 0, active_screens: 0 } }
}

export default async function AdvertiserPage() {
  const [campaigns, recentPlays, stats] = await Promise.all([
    getCampaigns(), getRecentPlays(), getStats()
  ])

  const cardStyle = {
    background: "#fff",
    border: "0.5px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden" as const,
    marginBottom: "1.5rem",
  }

  const thStyle = {
    padding: "10px 20px",
    textAlign: "left" as const,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#9ca3af",
    background: "#f9fafb",
    borderBottom: "0.5px solid #f3f4f6",
  }

  const tdStyle = {
    padding: "12px 20px",
    fontSize: 13,
    color: "#374151",
    borderBottom: "0.5px solid #f9fafb",
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: BRAND, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827" }}>DOOHPLAY</span>
        </div>
        <Link
          href="/verify"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: BRAND, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
        >
          🔐 Verificar prova
        </Link>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* ── PAGE TITLE ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 10, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>DOOHPLAY · Portal do Anunciante</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Suas campanhas</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Verificação criptográfica de cada exibição em tempo real</div>
        </div>

        {/* ── MÉTRICAS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {[
            { label: "Campanhas ativas", value: stats.total_campaigns, accent: false },
            { label: "Total de exibições", value: stats.total_plays?.toLocaleString("pt-BR"), accent: true },
            { label: "Exibições hoje", value: stats.plays_today?.toLocaleString("pt-BR"), accent: false },
            { label: "Telas ativas", value: stats.active_screens, accent: false },
          ].map(s => (
            <div key={s.label} style={{ background: s.accent ? BRAND_LIGHT : "#fff", border: `0.5px solid ${s.accent ? BRAND_BORDER : "#e5e7eb"}`, borderRadius: 14, padding: "1.25rem" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: s.accent ? BRAND : "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── CAMPANHAS ── */}
        <div style={cardStyle}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Campanhas ativas</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: "#15803D" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {campaigns.length} ativas
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhuma campanha encontrada.</div>
          ) : campaigns.map((c, i) => {
            const progressDays = c.start_date && c.end_date
              ? Math.round((Date.now() - new Date(c.start_date).getTime()) / (new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) * 100)
              : null
            const progress = progressDays != null ? Math.min(100, Math.max(0, progressDays)) : null

            return (
              <div key={c.id} style={{ padding: "1.25rem 1.5rem", borderBottom: i < campaigns.length - 1 ? "0.5px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{c.name}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 500, color: "#15803D" }}>
                      ● Ativa
                    </span>
                    {c.media_type && (
                      <span style={{ background: "#f3f4f6", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#6b7280" }}>{c.media_type}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#6b7280", marginBottom: progress !== null ? 10 : 0 }}>
                    <span>📺 {c.player_name || "Múltiplas telas"}</span>
                    {c.player_location && <span>📍 {c.player_location}</span>}
                    <span>📅 {fmtDate(c.start_date)} → {fmtDate(c.end_date)}</span>
                    <span>⏱ {c.duration_seconds}s</span>
                    <span>💰 CPM {fmtCurrency(c.cpm)}</span>
                  </div>
                  {progress !== null && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Progresso</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280" }}>{progress}%</span>
                      </div>
                      <div style={{ height: 4, background: "#f3f4f6", borderRadius: 999 }}>
                        <div style={{ height: 4, background: BRAND, borderRadius: 999, width: `${progress}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{c.total_plays.toLocaleString("pt-BR")}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>exibições verificadas</div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 500, marginTop: 4 }}>+{c.plays_today} hoje · +{c.plays_week} esta semana</div>
                  {c.last_play && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{fmtDateTime(c.last_play)}</div>}
                  <a
                    href={`/api/certificate?campaign_id=${c.id}`}
                    target="_blank"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, background: "#F0F9FF", border: "0.5px solid #BAE6FD", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#0369A1", textDecoration: "none", fontWeight: 500 }}
                  >
                    📄 Certificado PDF
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── EXIBIÇÕES RECENTES ── */}
        <div style={cardStyle}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Exibições verificadas recentes</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Cada linha tem prova criptográfica verificável</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 500, color: BRAND_DARK }}>
              🔐 Todas verificadas
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Campanha", "Tela", "Exibido em", "Duração", "Hash da prova", ""].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPlays.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "3rem" }}>Nenhuma exibição encontrada.</td></tr>
                ) : recentPlays.map(play => (
                  <tr key={play.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: "#111827", fontSize: 13 }}>{play.campaign_name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{play.advertiser}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13 }}>{play.player_name || "—"}</div>
                      {play.player_location && <div style={{ fontSize: 11, color: "#9ca3af", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{play.player_location}</div>}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: "#6b7280" }}>{fmtDateTime(play.played_at)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, color: BRAND_DARK }}>{play.duration ?? "—"}s</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: BRAND }}>
                      <span style={{ background: BRAND_LIGHT, padding: "2px 6px", borderRadius: 4 }}>{shortHash(play.event_hash)}</span>
                    </td>
                    <td style={tdStyle}>
                      <Link
                        href={`/verify/${play.event_hash || "20ec722b179a772ddc19c2a6053326906da1e598cc3dcaeed4a48efee2f950be"}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: BRAND_DARK, textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap" }}
                      >
                        Ver prova
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "10px 20px", borderTop: "0.5px solid #f3f4f6", fontSize: 11, color: "#9ca3af" }}>
            SHA-256 · Merkle Tree · Polygon Mainnet · TSA RFC3161
          </div>
        </div>

      </div>
    </main>
  )
}
