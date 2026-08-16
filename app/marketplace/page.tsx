// app/marketplace/page.tsx
export const dynamic = "force-dynamic"

import Link from "next/link"
import { getPool } from "@/lib/db"
import MarketplaceFilters from "./filters"
import MarketplaceCTA from "./cta"

const BG     = "#080C18"
const SURF   = "#0F1629"
const BORDER = "rgba(255,255,255,0.07)"
const TEXT   = "#F1F5F9"
const TEXT2  = "#94A3B8"
const MUTED  = "#475569"
const BLUE   = "#3B82F6"
const GREEN  = "#10B981"
const AMBER  = "#F59E0B"
const PURPLE = "#8B5CF6"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractCity(location: string | null, name: string): string {
  if (!location && !name) return "Brasil"
  const str = `${location ?? ""} ${name ?? ""}`.toLowerCase()
  if (str.includes("são paulo") || str.includes(", sp"))  return "São Paulo"
  if (str.includes("rio de janeiro") || str.includes(", rj")) return "Rio de Janeiro"
  if (str.includes("belo horizonte") || str.includes(", mg")) return "Belo Horizonte"
  if (str.includes("curitiba") || str.includes(", pr"))   return "Curitiba"
  if (str.includes("porto alegre") || str.includes(", rs")) return "Porto Alegre"
  if (str.includes("salvador") || str.includes(", ba"))   return "Salvador"
  if (str.includes("fortaleza") || str.includes(", ce"))  return "Fortaleza"
  if (str.includes("recife") || str.includes(", pe"))     return "Recife"
  if (str.includes("manaus") || str.includes(", am"))     return "Manaus"
  if (str.includes("brasília") || str.includes(", df"))   return "Brasília"
  return "São Paulo"
}

function extractSegment(name: string, businessType: string | null): string {
  if (businessType) return businessType
  const n = name.toLowerCase()
  if (n.includes("barbearia") || n.includes("barber")) return "Barbearia"
  if (n.includes("padaria"))   return "Padaria"
  if (n.includes("farmácia") || n.includes("farmacia")) return "Farmácia"
  if (n.includes("pizza") || n.includes("restaurante")) return "Restaurante"
  if (n.includes("café") || n.includes("cafeteria") || n.includes("doceria")) return "Cafeteria"
  if (n.includes("academia")) return "Academia"
  if (n.includes("salão") || n.includes("salon")) return "Salão de Beleza"
  if (n.includes("shopping")) return "Shopping"
  return "Comércio"
}

function segmentIcon(seg: string): string {
  const map: Record<string, string> = {
    "Barbearia": "✂️", "Padaria": "🍞", "Farmácia": "💊",
    "Restaurante": "🍕", "Cafeteria": "☕", "Academia": "🏋️",
    "Salão de Beleza": "💅", "Shopping": "🛒", "Comércio": "🏪",
  }
  return map[seg] ?? "📺"
}

// CPM ilustrativo por faixa de volume - nao e preco fechado, so uma
// referencia pra conversa comercial. Rotulado como estimativa na UI.
function cpmEstimate(plays30d: number): string {
  if (plays30d > 500) return "R$ 8,00"
  if (plays30d > 200) return "R$ 12,00"
  if (plays30d > 50)  return "R$ 15,00"
  return "R$ 18,00"
}

// Antes multiplicava o total historico de exibicoes (contagem acumulada
// desde sempre) por 30, como se fosse media diaria - inflava muito o
// numero de telas com historico longo. Agora usa a contagem real dos
// ultimos 30 dias (plays_30d, vindo direto do banco), sem extrapolacao.
function audienceEstimate(plays30d: number): string | null {
  if (plays30d <= 0) return null
  return `${plays30d.toLocaleString("pt-BR")} / mês`
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function getScreens() {
  const pool = getPool()
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id::text,
        p.name,
        p.location,
        p.device_type,
        p.latitude,
        p.longitude,
        p.is_active,
        COALESCE(sc.name,          NULL) AS client_name,
        COALESCE(sc.business_type, NULL) AS business_type,
        COALESCE(sc.city,          NULL) AS client_city,
        COUNT(de.id)::int               AS total_plays,
        COUNT(de.id) FILTER (WHERE de.played_at >= NOW() - INTERVAL '30 days')::int AS plays_30d,
        MAX(p.last_ping)::text          AS last_ping
      FROM players p
      LEFT JOIN studio_clients sc ON sc.player_id = p.id
      LEFT JOIN display_events de ON de.player_id  = p.id
      WHERE p.latitude IS NOT NULL
      GROUP BY p.id, p.name, p.location, p.device_type,
               p.latitude, p.longitude, p.is_active,
               sc.name, sc.business_type, sc.city
      ORDER BY total_plays DESC
      LIMIT 50
    `)
    return rows.map(r => ({
      ...r,
      city:    r.client_city ?? extractCity(r.location, r.name),
      segment: extractSegment(r.name, r.business_type),
    }))
  } catch { return [] }
}

async function getSummary() {
  const pool = getPool()
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                          AS total,
        COUNT(*) FILTER (WHERE latitude IS NOT NULL)::int     AS with_coords,
        COUNT(DISTINCT
          CASE
            WHEN location LIKE '%SP%' OR location LIKE '%São Paulo%' THEN 'SP'
            WHEN location LIKE '%RJ%' THEN 'RJ'
            ELSE 'OTHER'
          END
        )::int                                                AS cities
      FROM players
      WHERE is_active = true
    `)
    return rows[0] ?? { total: 0, with_coords: 0, cities: 0 }
  } catch { return { total: 0, with_coords: 0, cities: 0 } }
}

export default async function MarketplacePage() {
  const [screens, summary] = await Promise.all([getScreens(), getSummary()])

  const cities   = [...new Set(screens.map(s => s.city))].sort()
  const segments = [...new Set(screens.map(s => s.segment))].sort()

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .screen-card:hover { border-color: rgba(59,130,246,0.4) !important; transform: translateY(-2px); }
        .screen-card { transition: all .15s; }
        .filter-btn:hover { border-color: rgba(59,130,246,0.4) !important; color: #F1F5F9 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>DOOH<span style={{ color: BLUE }}>PLAY</span></span>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT2 }}>
            <span style={{ color: GREEN, fontWeight: 600 }}>● </span>
            {summary.total} telas verificadas
          </span>
          <Link href="/trust-center" style={{ fontSize: 12, color: TEXT2, textDecoration: "none", padding: "6px 12px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
            🛡 Trust Center
          </Link>
          <Link href="/onboarding" style={{ fontSize: 12, color: "#fff", textDecoration: "none", padding: "6px 14px", background: BLUE, borderRadius: 8, fontWeight: 600 }}>
            Instalar Tela
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: `linear-gradient(135deg, rgba(30,58,138,0.4) 0%, ${BG} 100%)`, borderBottom: `1px solid ${BORDER}`, padding: "3rem 1.5rem 2.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: BLUE, fontWeight: 500, marginBottom: 16 }}>
            📺 Marketplace de Mídia DOOH
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>
            Anuncie em telas verificadas<br />
            <span style={{ color: BLUE }}>em todo o Brasil.</span>
          </h1>
          <p style={{ fontSize: 16, color: TEXT2, marginBottom: 24, maxWidth: 560, lineHeight: 1.6 }}>
            Inventário auditável com Proof-of-Play. Cada exibição registrada na blockchain com certificação ICP Brasil.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { value: String(summary.total),   label: "Telas ativas",      color: BLUE   },
              { value: `${cities.length}+`,     label: "Cidades",           color: GREEN  },
              { value: "Auditável",             label: "Trust Score",       color: GREEN  },
              { value: "ICP A3",                label: "Certificação",      color: PURPLE },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

        <MarketplaceFilters screens={screens} cities={cities} segments={segments} />

        {/* CTA FINAL */}
        <MarketplaceCTA total={summary.total} cities={cities.length} />
      </div>

    </main>
  )
}

// REMOVIDO - modal agora está em filters.tsx
function _unused() {
  return (
    <>
      <div id="modal-overlay" style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div id="modal-box" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div id="modal-title" style={{ fontSize: 17, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Anunciar nessa tela</div>
              <div id="modal-sub" style={{ fontSize: 12, color: "#9CA3AF" }}>Nossa equipe entra em contato em até 2h pelo WhatsApp</div>
            </div>
            <button id="modal-close" style={{ background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div id="modal-success" style={{ display: "none", textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB", marginBottom: 8 }}>Solicitação enviada!</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>Nossa equipe vai entrar em contato pelo WhatsApp em até 2 horas.</div>
              <button id="modal-close-2" style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
            </div>
            <div id="modal-form">
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seu nome *</label>
                <input id="f-name" placeholder="João Silva" style={{ width: "100%", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Empresa</label>
                <input id="f-company" placeholder="Nome da empresa" style={{ width: "100%", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>WhatsApp (com DDD) *</label>
                <input id="f-phone" placeholder="11 99999-9999" type="tel" style={{ width: "100%", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }} />
              </div>
              <div id="modal-error" style={{ display: "none", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#EF4444" }}></div>
              <button id="modal-submit" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Solicitar proposta →
              </button>
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#4B5563" }}>
                📱 Resposta em até 2h · Sem compromisso
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var overlay  = document.getElementById('modal-overlay')
          var closeBtn = document.getElementById('modal-close')
          var closeBtn2= document.getElementById('modal-close-2')
          var submitBtn= document.getElementById('modal-submit')
          var title    = document.getElementById('modal-title')
          var sub      = document.getElementById('modal-sub')
          var form     = document.getElementById('modal-form')
          var success  = document.getElementById('modal-success')
          var errDiv   = document.getElementById('modal-error')
          var screenId = ''
          var screenName = ''

          function openModal(id, name, city) {
            screenId   = id   || ''
            screenName = name || 'tela selecionada'
            if (title) title.textContent = 'Anunciar em: ' + screenName
            if (sub)   sub.textContent   = city ? 'Localização: ' + city + ' · Resposta em até 2h' : 'Nossa equipe entra em contato em até 2h pelo WhatsApp'
            if (overlay) { overlay.style.display = 'flex' }
            if (form)    { form.style.display = 'block' }
            if (success) { success.style.display = 'none' }
            if (errDiv)  { errDiv.style.display = 'none' }
          }

          function closeModal() {
            if (overlay) overlay.style.display = 'none'
            history.replaceState(null, '', '/marketplace')
          }

          // Checar URL params ao carregar
          function checkParams() {
            var params = new URLSearchParams(window.location.search)
            var id    = params.get('anunciar')
            var name  = params.get('tela')
            var city  = params.get('cidade')
            var demo  = params.get('demo')
            if (id || demo) {
              openModal(id || '', name ? decodeURIComponent(name) : 'Rede DOOHPLAY', city ? decodeURIComponent(city) : '')
            }
          }

          if (closeBtn)  closeBtn.addEventListener('click',  closeModal)
          if (closeBtn2) closeBtn2.addEventListener('click', closeModal)
          if (overlay)   overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal() })

          if (submitBtn) submitBtn.addEventListener('click', async function() {
            var name    = document.getElementById('f-name').value.trim()
            var company = document.getElementById('f-company').value.trim()
            var phone   = document.getElementById('f-phone').value.trim()
            if (!name)  { errDiv.textContent = 'Informe seu nome.'; errDiv.style.display = 'block'; return }
            if (!phone || phone.replace(/\\D/g,'').length < 10) { errDiv.textContent = 'Informe um WhatsApp válido com DDD.'; errDiv.style.display = 'block'; return }
            errDiv.style.display = 'none'
            submitBtn.textContent = 'Enviando…'
            submitBtn.disabled = true
            try {
              await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, company, phone, segment: 'Anunciante', screen_id: screenId, screen_name: screenName }),
              })
              form.style.display    = 'none'
              success.style.display = 'block'
            } catch(e) {
              errDiv.textContent = 'Erro ao enviar. Tente novamente.'
              errDiv.style.display = 'block'
              submitBtn.textContent = 'Solicitar proposta →'
              submitBtn.disabled = false
            }
          })

          checkParams()
        })()
      `}} />
    </>
  )
}
