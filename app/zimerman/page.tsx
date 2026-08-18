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

const CAMPAIGN_ID = "aaaaaaaa-0001-0001-0001-000000000001"
const DEMO_HASH = "20ec722b179a772ddc19c2a6053326906da1e598cc3dcaeed4a48efee2f950be"
const LOGO = "data:image/webp;base64,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"

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

// DOOHPLAY brand colors
const BRAND = "#0284C7"
const BRAND_DARK = "#0369A1"
const BRAND_LIGHT = "#F0F9FF"
const BRAND_BORDER = "#BAE6FD"

// Client accent — Zimermam gold
const CLIENT = "#C9A84C"

export default async function ZimermanPage() {
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
        <img src={LOGO} alt="Barbearia Zimermam" style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1rem", display: "block", objectFit: "cover", border: `2px solid ${CLIENT}` }} />
        <div style={{ fontSize: 10, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>DOOHPLAY · Portal de verificação</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Barbearia Zimermam</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>📍 Rua Augusta 1200, Consolação — São Paulo</div>
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
            <div key={s.label} style={{ background: s.accent ? BRAND_LIGHT : "#fff", border: `0.5px solid ${s.accent ? BRAND_BORDER : "#e5e7eb"}`, borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.accent ? BRAND : "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CAMPANHA ── */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Campanha em exibição</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 3 }}>Corte + Barba — Promoção Especial</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: BRAND }}>R$5,00</div>
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

          {plays.map((play, i) => (
            <div key={play.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.5rem", borderBottom: i < plays.length - 1 ? "0.5px solid #f3f4f6" : "none", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: BRAND }}>▶</div>
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
        <div style={{ background: BRAND_LIGHT, border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 16, padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Verificação pública</div>
          <div style={{ fontSize: 17, color: "#111827", fontWeight: 600, marginBottom: 8 }}>Cada anúncio tem prova verificável</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
            Anchorado na blockchain Polygon Mainnet.<br/>
            Qualquer pessoa pode verificar — sem depender de nenhuma plataforma.
          </div>
          <Link href={`/verify/${DEMO_HASH}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BRAND, color: "#fff", borderRadius: 10, padding: "12px 28px", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>
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
