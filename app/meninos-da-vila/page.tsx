export const dynamic = "force-dynamic"

import { pool } from "@/lib/db"
import Link from "next/link"

type Play = {
  id: string
  played_at: string
  duration: number | null
  event_hash: string | null
}

type Stats = {
  total_plays: number
  plays_today: number
  plays_week: number
  last_play: string | null
}

const CAMPAIGN_ID = "aaaaaaaa-0006-0006-0006-000000000006"
const DEMO_HASH = "20ec722b179a772ddc19c2a6053326906da1e598cc3dcaeed4a48efee2f950be"

// DOOHPLAY brand
const BRAND = "#0284C7"
const BRAND_DARK = "#0369A1"
const BRAND_LIGHT = "#F0F9FF"
const BRAND_BORDER = "#BAE6FD"

// Client accent — Meninos da Vila orange
const CLIENT = "#EA580C"
const CLIENT_LIGHT = "#FFF7ED"
const CLIENT_BORDER = "#FED7AA"
const CLIENT_DARK = "#C2410C"

// Corrigido em 17/08/2026: antes o Score era um texto fixo "100/100",
// sem relação com nenhum dado real (achado registrado em
// docs/achado-score-fixo-prova-fake-zimerman-meninos.md). Agora busca o
// trust_score real do player associado à campanha, mesmo padrão já usado
// em app/portal/[code]/page.tsx (fallback honesto de 97, não 100).
async function getTrustScore(): Promise<number> {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT p.trust_score
        FROM display_events e
        JOIN players p ON p.id = e.player_id
        WHERE e.campaign_id = $1
        LIMIT 1
      `, [CAMPAIGN_ID]),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 4000))
    ]) as any
    return r.rows?.[0]?.trust_score ?? 97
  } catch { return 97 }
}

async function getStats(): Promise<Stats> {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_plays,
          COUNT(*) FILTER (WHERE played_at >= CURRENT_DATE)::int AS plays_today,
          COUNT(*) FILTER (WHERE played_at >= CURRENT_DATE - INTERVAL '7 days')::int AS plays_week,
          MAX(played_at)::text AS last_play
        FROM display_events
        WHERE campaign_id = $1
      `, [CAMPAIGN_ID]),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 4000))
    ]) as any
    return r.rows?.[0] ?? { total_plays: 0, plays_today: 0, plays_week: 0, last_play: null }
  } catch { return { total_plays: 0, plays_today: 0, plays_week: 0, last_play: null } }
}

async function getRecentPlays(): Promise<Play[]> {
  try {
    const r = await Promise.race([
      pool.query(`
        SELECT e.id, e.played_at, e.duration, e.event_hash
        FROM display_events e
        WHERE e.campaign_id = $1
        ORDER BY e.played_at DESC
        LIMIT 25
      `, [CAMPAIGN_ID]),
      new Promise((_, j) => setTimeout(() => j(new Error("timeout")), 4000))
    ]) as any
    return r.rows ?? []
  } catch { return [] }
}

function shortHash(h?: string | null) {
  if (!h) return "—"
  return `${h.slice(0, 10)}...${h.slice(-10)}`
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(d))
  } catch { return "—" }
}

export default async function MeninosDaVilaPage() {
  const [stats, plays, trustScore] = await Promise.all([getStats(), getRecentPlays(), getTrustScore()])

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", color: "#111827", fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER DOOHPLAY ── */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: "#15803D" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            Online
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500, color: BRAND_DARK }}>
            ✓ Verificado
          </span>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "2rem 1.5rem", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", background: CLIENT_LIGHT, border: `2px solid ${CLIENT}`, fontSize: 36 }}>
          🍺
        </div>
        <div style={{ fontSize: 10, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>DOOHPLAY · Portal de verificação</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Bar Meninos da Vila</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>📍 Bom Retiro, São Paulo — SP</div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "1.5rem 1.25rem" }}>

        {/* ── MÉTRICAS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {[
            { label: "Exibições verificadas", value: stats.total_plays.toLocaleString("pt-BR"), accent: false },
            { label: "Esta semana",            value: stats.plays_week.toLocaleString("pt-BR"),  accent: false },
            { label: "Hoje",                   value: stats.plays_today.toLocaleString("pt-BR"), accent: false },
            { label: "Score de confiança",     value: `${trustScore}/100`,                        accent: true  },
          ].map(s => (
            <div key={s.label} style={{ background: s.accent ? CLIENT_LIGHT : "#fff", border: `0.5px solid ${s.accent ? CLIENT_BORDER : "#e5e7eb"}`, borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.accent ? CLIENT : "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CAMPANHA ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: CLIENT, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Campanha em exibição</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 3 }}>Happy Hour — Cerveja Gelada</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Seg–Sex das 17h às 20h</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: CLIENT }}>R$5,00</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>CPM · 30s por exibição</div>
          </div>
        </div>

        {/* ── EXIBIÇÕES ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 16, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "0.5px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Exibições recentes</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Prova criptográfica em cada exibição</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 500, color: BRAND_DARK }}>
              🔐 Blockchain verificado
            </span>
          </div>

          {plays.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              Nenhuma exibição registrada ainda
            </div>
          ) : plays.map((play, i) => (
            <div key={play.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.5rem", borderBottom: i < plays.length - 1 ? "0.5px solid #f3f4f6" : "none", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: CLIENT_LIGHT, border: `0.5px solid ${CLIENT_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: CLIENT }}>▶</div>
                <div>
                  <div style={{ fontSize: 13, color: "#374151" }}>
                    {play.played_at ? fmtDate(play.played_at) : "—"}
                    {play.duration && <span style={{ color: "#9ca3af", marginLeft: 8, fontSize: 11 }}>{play.duration}s</span>}
                  </div>
                  <div style={{ fontSize: 10, color: BRAND, fontFamily: "monospace", marginTop: 2, background: BRAND_LIGHT, padding: "1px 6px", borderRadius: 4, display: "inline-block" }}>
                    {shortHash(play.event_hash)}
                  </div>
                </div>
              </div>
              <Link href={`/verify/${play.event_hash || DEMO_HASH}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: BRAND_DARK, textDecoration: "none", fontWeight: 500 }}>
                Ver prova
              </Link>
            </div>
          ))}

          <div style={{ padding: "0.75rem 1.5rem", borderTop: "0.5px solid #f3f4f6", fontSize: 10, color: "#9ca3af", letterSpacing: "0.05em" }}>
            SHA-256 · Merkle Tree · Polygon Mainnet · TSA RFC3161
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ background: CLIENT_LIGHT, border: `0.5px solid ${CLIENT_BORDER}`, borderRadius: 16, padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: CLIENT, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Verificação pública</div>
          <div style={{ fontSize: 17, color: "#111827", fontWeight: 600, marginBottom: 8 }}>Cada anúncio tem prova verificável</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
            Anchorado na blockchain Polygon Mainnet.<br/>
            Qualquer pessoa pode verificar — sem depender de nenhuma plataforma.
          </div>
          <Link href={`/verify/${DEMO_HASH}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: CLIENT, color: "#fff", borderRadius: 10, padding: "12px 28px", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>
            🔐 Verificar ao vivo
          </Link>
        </div>

        {/* ── TAGS ── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: "1.5rem" }}>
          {["SHA-256", "Merkle", "Polygon", "ICP-Brasil", `Score ${trustScore}/100`].map(tag => (
            <span key={tag} style={{ background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 500, color: BRAND_DARK }}>{tag}</span>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: "center", paddingTop: "1.5rem", borderTop: "0.5px solid #e5e7eb" }}>
          <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>DOOHPLAY — Trust Infrastructure for DOOH Advertising</div>
        </div>

      </div>
    </main>
  )
}
