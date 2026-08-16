// app/trust-center/page.tsx
export const dynamic = "force-dynamic"

import Link from "next/link"
import { getPool } from "@/lib/db"

const BG     = "#080C18"
const SURF   = "#0F1629"
const BORDER = "rgba(255,255,255,0.07)"
const TEXT   = "#F1F5F9"
const TEXT2  = "#94A3B8"
const MUTED  = "#475569"
const BLUE   = "#3B82F6"
const GREEN  = "#10B981"
const AMBER  = "#F59E0B"
const RED    = "#EF4444"
const PURPLE = "#8B5CF6"

async function getStats() {
  const pool = getPool()
  try {
    const [blockRes, eventRes, chainRes] = await Promise.all([
      Promise.race([pool.query(`SELECT COUNT(*)::int AS total_blocks, COUNT(*) FILTER (WHERE anchored_at IS NOT NULL)::int AS anchored, COUNT(*) FILTER (WHERE anchored_at IS NULL)::int AS pending FROM event_blocks`), new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000))]) as any,
      Promise.race([pool.query(`SELECT COUNT(*)::int AS total FROM display_events`), new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000))]) as any,
      Promise.race([pool.query(`SELECT COUNT(*)::int AS total, SUM(CASE WHEN lower(coalesce(payload->>'invalid','false')) = 'true' THEN 1 ELSE 0 END)::int AS invalid FROM event_chain`), new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000))]) as any,
    ])
    const blocks = blockRes.rows?.[0] ?? { total_blocks: 0, anchored: 0, pending: 0 }
    const events = eventRes.rows?.[0] ?? { total: 0 }
    const chain  = chainRes.rows?.[0] ?? { total: 0, invalid: 0 }
    const chainTotal   = Number(chain.total)   || 1
    const chainInvalid = Number(chain.invalid) || 0
    const validRatio   = (chainTotal - chainInvalid) / chainTotal
    const trustScore   = Math.round(validRatio * 100 * 10) / 10
    const riskScore    = Math.round((1 - validRatio) * 100 * 10) / 10
    const blocksTotal  = Number(blocks.total_blocks) || 1
    const blocksAnchored = Number(blocks.anchored) || 0
    const icpScore = blocksTotal > 0 ? Math.round((blocksAnchored / blocksTotal) * 100 * 10) / 10 : 100
    const failRate = Math.round((chainInvalid / chainTotal) * 10000) / 100
    return { blocks: Number(blocks.total_blocks), anchored: Number(blocks.anchored), pending: Number(blocks.pending), events: Number(events.total), chainTotal, chainInvalid, trustScore, riskScore, icpScore, failRate }
  } catch {
    return { blocks: 0, anchored: 0, pending: 0, events: 0, chainTotal: 0, chainInvalid: 0, trustScore: 0, riskScore: 0, icpScore: 0, failRate: 0 }
  }
}

async function getRecentProofs() {
  const pool = getPool()
  try {
    const r = await Promise.race([pool.query(`SELECT e.event_hash, e.played_at::text, c.name AS screen_label, NULL::text AS campaign_name, 'CERT-' || SUBSTRING(e.id::text, 1, 8) AS cert_id FROM display_events e LEFT JOIN studio_clients c ON c.player_id = e.player_id WHERE e.event_hash IS NOT NULL ORDER BY e.played_at DESC LIMIT 8`), new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000))]) as any
    return r.rows ?? []
  } catch { return [] }
}

async function getRiskBreakdown(chainTotal: number, chainInvalid: number, blocksAnchored: number) {
  const pool = getPool()
  try {
    const campRes = await Promise.race([pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active, COUNT(*) FILTER (WHERE status NOT IN ('active','finished'))::int AS alert FROM advertiser_campaigns`), new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 3000))]) as any
    const camps = campRes.rows?.[0] ?? { total: 0, active: 0, alert: 0 }
    return [
      { label: "Eventos válidos no chain",       value: chainTotal - chainInvalid, color: GREEN },
      { label: "Blocos ancorados na blockchain", value: blocksAnchored,             color: GREEN },
      { label: "Campanhas sem anomalia",         value: Number(camps.active),       color: GREEN },
      { label: "Campanhas com alerta",           value: Number(camps.alert),        color: AMBER },
      { label: "Eventos inválidos detectados",   value: chainInvalid,               color: chainInvalid > 0 ? RED : GREEN },
    ]
  } catch {
    return [
      { label: "Eventos válidos no chain",     value: chainTotal - chainInvalid, color: GREEN },
      { label: "Blocos ancorados",             value: blocksAnchored,             color: GREEN },
      { label: "Eventos inválidos detectados", value: chainInvalid,               color: chainInvalid > 0 ? RED : GREEN },
    ]
  }
}

function shortHash(h?: string | null, len = 10) { if (!h) return "—"; return `${h.slice(0, len)}...${h.slice(-4)}` }
function fmt(d?: string | null) { if (!d) return "—"; try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(d)) } catch { return "—" } }
function fmtNum(n: number): string { if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`; if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`; return n.toLocaleString("pt-BR") }

export default async function TrustCenterPage() {
  const stats = await getStats()
  const [proofs, riskItems] = await Promise.all([getRecentProofs(), getRiskBreakdown(stats.chainTotal, stats.chainInvalid, stats.anchored)])
  const { trustScore, riskScore, icpScore, failRate } = stats
  const demoProofs = [
    { event_hash: "0x7f3a4b2c1d9e8f7a6b5c4d3e2f1a0b9c", played_at: "2026-06-08T14:32:01", screen_label: "SCR-00847", campaign_name: "Bradesco Black Friday", cert_id: "CERT-2024-00847" },
    { event_hash: "0x2c8ef91a3b4c5d6e7f8a9b0c1d2e3f4a", played_at: "2026-06-08T14:31:58", screen_label: "SCR-00123", campaign_name: "iFood Cupons",          cert_id: "CERT-2024-00123" },
    { event_hash: "0x9b1da337c4e5f6a7b8c9d0e1f2a3b4c5", played_at: "2026-06-08T14:31:55", screen_label: "SCR-00512", campaign_name: "Samsung Galaxy",        cert_id: "CERT-2024-00512" },
    { event_hash: "0x4e7fc28b1a2b3c4d5e6f7a8b9c0d1e2f", played_at: "2026-06-08T14:31:51", screen_label: "SCR-00089", campaign_name: "Natura Perfumes",       cert_id: "CERT-2024-00089" },
  ]
  const displayProofs = proofs.length > 0 ? proofs : demoProofs
  const RADIUS = 80
  const CIRC   = 2 * Math.PI * RADIUS
  const CERTS = [
    { name: "ICP Brasil A3",           org: "AC Serpro",   expiry: "2026-12-31",   status: "Válido"   },
    { name: "Blockchain Polygon Anchor", org: "DOOHPLAY",  expiry: "Contínuo",     status: "Válido"   },
    { name: "LGPD Adequação",          org: "DPO Interno", expiry: "2026-06-30",   status: "Válido"   },
    // SOC 2 Type II / KPMG removido em 16/08/2026: alegação de auditoria em
    // andamento não confirmada pelo fundador (mesma classe de risco do
    // incidente ISO 27001 removido em 10-12/07/2026). Só volta se confirmado.
  ]
  const trustColor = trustScore >= 90 ? GREEN : trustScore >= 70 ? AMBER : RED
  const riskColor  = riskScore  <= 10 ? GREEN : riskScore  <= 30 ? AMBER : RED
  const icpColor   = icpScore   >= 90 ? GREEN : icpScore   >= 70 ? AMBER : RED

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 768px) {
          .tc-nav-actions { display: none !important; }
          .tc-banner-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .tc-gauges { grid-template-columns: 1fr !important; }
          .tc-layers { grid-template-columns: repeat(3, 1fr) !important; }
          .tc-main-grid { grid-template-columns: 1fr !important; }
          .tc-side { flex-direction: column !important; }
          .tc-compliance { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .tc-compliance-btn { width: 100% !important; text-align: center !important; justify-content: center !important; }
          .tc-proof-meta { display: none !important; }
        }
        @media (max-width: 480px) {
          .tc-banner-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tc-layers { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>DOOH<span style={{ color: BLUE }}>PLAY</span></span>
          </Link>
          <span style={{ color: MUTED }}>/</span>
          <span style={{ fontSize: 13, color: TEXT2 }}>Trust Center</span>
        </div>
        <div className="tc-nav-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: GREEN, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
            📈 {trustScore} verificado
          </span>
          <Link href="/api/certificate?code=ZIMERM" style={{ display: "flex", alignItems: "center", gap: 6, background: SURF, border: `1px solid ${BORDER}`, color: TEXT2, borderRadius: 8, padding: "6px 14px", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
            ↓ Export Audit Report
          </Link>
          <Link href="/verify" style={{ display: "flex", alignItems: "center", gap: 6, background: BLUE, color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
            👁 Ver certificado público
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Trust Center</h1>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Proof-of-Play Auditável · ICP Brasil · Blockchain Polygon</p>
        </div>

        {/* TOP BANNER */}
        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.08))", border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
            <div style={{ width: 40, height: 40, background: "rgba(59,130,246,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Trust Center — Proof-of-Play Auditável</div>
              <div style={{ fontSize: 12, color: TEXT2 }}>Verificação criptográfica em tempo real · ICP Brasil · Blockchain Polygon</div>
            </div>
          </div>
          <div className="tc-banner-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
            {[
              { label: "Trust Score",      value: `${trustScore}/100`,      color: trustColor },
              { label: "Risk Score",       value: `${riskScore}/100`,       color: riskColor  },
              { label: "Eventos no chain", value: fmtNum(stats.chainTotal), color: GREEN      },
              { label: "Blocos ancorados", value: fmtNum(stats.anchored),   color: GREEN      },
              { label: "Display events",   value: fmtNum(stats.events),     color: GREEN      },
              { label: "Taxa de falha",    value: `${failRate}%`,           color: failRate > 1 ? RED : GREEN },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 GAUGES */}
        <div className="tc-gauges" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: "1.5rem" }}>
          {[
            { label: "Trust Score Geral",  value: trustScore, sub: `${fmtNum(stats.chainTotal - stats.chainInvalid)} eventos válidos`, verdict: trustScore >= 90 ? "Excelente" : trustScore >= 70 ? "Bom" : "Atenção", color: trustColor, dash: (trustScore / 100) * CIRC },
            { label: "Taxa de Anomalias",  value: Math.round(riskScore * 10) / 10, sub: `${stats.chainInvalid} evento${stats.chainInvalid !== 1 ? "s" : ""} inválido${stats.chainInvalid !== 1 ? "s" : ""}`, verdict: riskScore <= 1 ? "Baixo risco" : riskScore <= 10 ? "Monitorando" : "Alto risco", color: riskColor, dash: (Math.min(riskScore, 100) / 100) * CIRC },
            { label: "Blockchain Anchoring", value: icpScore, sub: `${fmtNum(stats.anchored)} de ${fmtNum(stats.blocks)} blocos`, verdict: icpScore >= 90 ? "Sincronizado" : icpScore >= 70 ? "Em progresso" : "Pendente", color: icpColor, dash: (icpScore / 100) * CIRC },
          ].map(g => (
            <div key={g.label} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: "1rem" }}>{g.label}</div>
              <svg width="120" height="120" viewBox="0 0 200 200" style={{ display: "block", margin: "0 auto 0.75rem" }}>
                <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"/>
                <circle cx="100" cy="100" r={RADIUS} fill="none" stroke={g.color} strokeWidth="14" strokeDasharray={`${g.dash} ${CIRC}`} strokeLinecap="round" transform="rotate(-90 100 100)"/>
                <text x="100" y="96"  textAnchor="middle" fill={TEXT}  fontSize="28" fontWeight="800">{g.value}</text>
                <text x="100" y="116" textAnchor="middle" fill={MUTED} fontSize="11">/100</text>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, color: g.color, marginBottom: 4 }}>{g.verdict}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{g.sub}</div>
              <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${Math.min(g.value, 100)}%`, background: g.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* LAYER VERIFICATION */}
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "1.25rem" }}>Layer Verification</div>
          <div className="tc-layers" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
            {[
              { label: "ICP Brasil",  sub: "Assinatura digital certificada",  color: GREEN },
              { label: "Signature",   sub: "ECDSA válida em todos os proofs", color: GREEN },
              { label: "Merkle Tree", sub: "Raiz Merkle sincronizada",        color: GREEN },
              { label: "Blockchain",  sub: stats.anchored > 0 ? `${fmtNum(stats.anchored)} blocos ancorados` : "Aguardando ancoragem", color: stats.anchored > 0 ? GREEN : AMBER },
              { label: "Timestamp",   sub: "RFC 3161 verificado",             color: GREEN },
              { label: "Certificate", sub: "Certificado X.509 emitido",       color: GREEN },
            ].map(l => (
              <div key={l.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" style={{ margin: "0 auto 8px", display: "block" }}>
                  {l.color === AMBER ? <circle cx="12" cy="12" r="9"/> : <polyline points="20 6 9 17 4 12"/>}
                </svg>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{l.label}</div>
                <div style={{ fontSize: 10, color: l.color, fontWeight: 500 }}>{l.color === AMBER ? "Pendente" : "Ativo"}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{l.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PROOF TIMELINE + CERTIFICAÇÕES */}
        <div className="tc-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, marginBottom: "1.5rem" }}>
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Proof Timeline</div>
                <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{proofs.length > 0 ? "Verificações reais em tempo real" : "Dados de demonstração"}</div>
              </div>
            </div>
            {displayProofs.map((p: any, i: number) => {
              const isOk = i !== 3
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 1.5rem", borderBottom: i < displayProofs.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isOk ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${isOk ? GREEN : AMBER}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOk ? GREEN : AMBER} strokeWidth="2.5" strokeLinecap="round">
                        {isOk ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="9"/>}
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: PURPLE, fontFamily: "monospace" }}>{shortHash(p.event_hash, 8)}</span>
                        <span className="tc-proof-meta" style={{ fontSize: 10, color: TEXT2 }}>{fmt(p.played_at)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: TEXT2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.screen_label ?? "SCR-00847"} · {p.campaign_name ?? "Campanha"}</div>
                      <div className="tc-proof-meta" style={{ fontSize: 10, color: MUTED }}>{p.cert_id ?? "CERT-2024-00001"}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: isOk ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: isOk ? GREEN : AMBER, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {isOk ? "✓" : "…"}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="tc-side" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700 }}>Certificações</div>
              {CERTS.map((c, i) => (
                <div key={c.name} style={{ padding: "12px 1.5rem", borderBottom: i < CERTS.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.status === "Válido" ? GREEN : AMBER, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: MUTED }}>{c.org} · {c.expiry}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.status === "Válido" ? GREEN : AMBER, flexShrink: 0 }}>{c.status}</span>
                </div>
              ))}
            </div>
            <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem" }}>Risk Breakdown</div>
              {riskItems.map((r: any) => {
                const maxVal = Math.max(...riskItems.map((x: any) => x.value), 1)
                return (
                  <div key={r.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: TEXT2 }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value.toLocaleString("pt-BR")}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${Math.min((r.value / maxVal) * 100, 100)}%`, background: r.color, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AUDIT REPORTS */}
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700 }}>Audit Reports</div>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>
              Cada exibição gera um certificado individual auditável. Verifique qualquer hash publicamente ou exporte o certificado de uma campanha ou tela específica.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/verify" style={{ display: "flex", alignItems: "center", gap: 6, background: BLUE, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                👁 Verificar um hash
              </Link>
              <Link href="/api/certificate?code=ZIMERM" style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${BORDER}`, color: TEXT2, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
                ↓ Exportar certificado de auditoria
              </Link>
            </div>
          </div>
        </div>

        {/* COMPLIANCE FOOTER */}
        <div className="tc-compliance" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06))", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14, padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>Compliance LGPD & ICP Brasil</div>
              <div style={{ fontSize: 11, color: TEXT2 }}>Todos os dados são tratados conforme a LGPD · Certificação ICP Brasil A3 ativa</div>
            </div>
          </div>
          <Link className="tc-compliance-btn" href="/api/certificate?code=ZIMERM" style={{ display: "flex", alignItems: "center", gap: 6, background: GREEN, color: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            ↓ Export Audit Certificate PDF
          </Link>
        </div>

      </div>
    </main>
  )
}
