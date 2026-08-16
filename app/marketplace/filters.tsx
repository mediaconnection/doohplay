// app/marketplace/filters.tsx
"use client"

import { useState, useEffect } from "react"

const SURF   = "#0F1629"
const BORDER = "rgba(255,255,255,0.07)"
const TEXT   = "#F1F5F9"
const TEXT2  = "#94A3B8"
const MUTED  = "#475569"
const BLUE   = "#3B82F6"
const GREEN  = "#10B981"
const RED    = "#EF4444"

function segmentIcon(seg: string): string {
  const map: Record<string, string> = {
    "Barbearia": "✂️", "Padaria": "🍞", "Farmácia": "💊",
    "Restaurante": "🍕", "Cafeteria": "☕", "Academia": "🏋️",
    "Salão de Beleza": "💅", "Shopping": "🛒", "Comércio": "🏪",
  }
  return map[seg] ?? "📺"
}

// CPM ilustrativo por faixa de volume - referencia pra conversa
// comercial, nao e preco fechado (por isso o rotulo "CPM (estimado)").
function cpmEstimate(plays30d: number): string {
  if (plays30d > 500) return "R$ 8,00"
  if (plays30d > 200) return "R$ 12,00"
  if (plays30d > 50)  return "R$ 15,00"
  return "R$ 18,00"
}

// Baseado na contagem real de exibicoes dos ultimos 30 dias (plays_30d),
// sem extrapolar total historico. Telas sem exibicao recente retornam
// null e o card mostra "Sem dado" em vez de um numero inflado.
function audienceEstimate(plays30d: number): string | null {
  if (plays30d <= 0) return null
  return `${plays30d.toLocaleString("pt-BR")} / mês`
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ screenId, screenName, screenCity, onClose }: {
  screenId: string
  screenName: string
  screenCity: string
  onClose: () => void
}) {
  const [form, setForm]     = useState({ name: "", company: "", phone: "" })
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState("")

  const submit = async () => {
    if (!form.name.trim()) { setError("Informe seu nome."); return }
    if (form.phone.replace(/\D/g, "").length < 10) { setError("Informe um WhatsApp válido com DDD."); return }
    setLoading(true); setError("")
    try {
      await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, segment: "Anunciante", screen_id: screenId, screen_name: screenName }),
      })
      setDone(true)
    } catch {
      setError("Erro ao enviar. Tente novamente.")
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#0B1020", border: "1px solid #1F2937",
    borderRadius: 8, padding: "11px 14px",
    color: TEXT, fontSize: 14, outline: "none",
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 4 }}>
              {screenName ? `Anunciar em: ${screenName}` : "Solicitar proposta"}
            </div>
            <div style={{ fontSize: 12, color: TEXT2 }}>
              {screenCity ? `Localização: ${screenCity} · Resposta em até 2h` : "Nossa equipe entra em contato em até 2h pelo WhatsApp"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Solicitação enviada!</div>
              <div style={{ fontSize: 14, color: TEXT2, marginBottom: 20 }}>Nossa equipe vai entrar em contato pelo WhatsApp em até 2 horas.</div>
              <button onClick={onClose} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seu nome *</label>
                <input style={inputStyle} placeholder="João Silva" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError("") }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Empresa</label>
                <input style={inputStyle} placeholder="Nome da empresa" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>WhatsApp (com DDD) *</label>
                <input style={inputStyle} placeholder="11 99999-9999" type="tel" value={form.phone} onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setError("") }} />
              </div>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: RED }}>
                  ⚠️ {error}
                </div>
              )}
              <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? MUTED : BLUE, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Enviando…" : "Solicitar proposta →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: MUTED }}>
                📱 Resposta em até 2h · Sem compromisso
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketplaceFilters({ screens, cities, segments }: {
  screens: any[]
  cities: string[]
  segments: string[]
}) {
  const [cityFilter,    setCityFilter]    = useState("Todas")
  const [segmentFilter, setSegmentFilter] = useState("Todos")
  const [search,        setSearch]        = useState("")
  const [modal, setModal] = useState<{ id: string; name: string; city: string } | null>(null)

  // Abre modal via URL params (links externos e botão "Solicitar proposta")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id   = params.get("anunciar")
    const name = params.get("tela")
    const city = params.get("cidade")
    const demo = params.get("demo")
    if (id || demo) {
      setModal({
        id:   id   || "",
        name: name ? decodeURIComponent(name) : "Rede DOOHPLAY",
        city: city ? decodeURIComponent(city) : "",
      })
      history.replaceState(null, "", "/marketplace")
    }
  }, [])

  const openModal = (id: string, name: string, city: string) => setModal({ id, name, city })
  const closeModal = () => setModal(null)

  const filtered = screens.filter(s => {
    const matchCity    = cityFilter    === "Todas" || s.city    === cityFilter
    const matchSegment = segmentFilter === "Todos" || s.segment === segmentFilter
    const matchSearch  = !search
      || s.client_name?.toLowerCase().includes(search.toLowerCase())
      || s.name?.toLowerCase().includes(search.toLowerCase())
      || s.location?.toLowerCase().includes(search.toLowerCase())
    return matchCity && matchSegment && matchSearch
  })

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .mkt-grid { grid-template-columns: 1fr !important; }
          .mkt-card-metrics { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 480px) and (max-width: 768px) {
          .mkt-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      {modal && <Modal screenId={modal.id} screenName={modal.name} screenCity={modal.city} onClose={closeModal} />}

      {/* Busca */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome, cidade ou endereço…"
          style={{ width: "100%", background: SURF, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 16px", color: TEXT, fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Filtro cidade */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Cidade</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Todas", ...cities].map(city => (
            <button key={city} onClick={() => setCityFilter(city)} style={{
              fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${cityFilter === city ? BLUE : BORDER}`,
              background: cityFilter === city ? BLUE + "22" : "transparent",
              color: cityFilter === city ? BLUE : TEXT2,
              fontWeight: cityFilter === city ? 600 : 400,
            }}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro segmento */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Segmento</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Todos", ...segments].map(seg => (
            <button key={seg} onClick={() => setSegmentFilter(seg)} style={{
              fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${segmentFilter === seg ? BLUE : BORDER}`,
              background: segmentFilter === seg ? BLUE + "22" : "transparent",
              color: segmentFilter === seg ? BLUE : TEXT2,
              fontWeight: segmentFilter === seg ? 600 : 400,
            }}>
              {segmentIcon(seg)} {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 16 }}>
        {filtered.length} tela{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        {(cityFilter !== "Todas" || segmentFilter !== "Todos" || search) && (
          <button onClick={() => { setCityFilter("Todas"); setSegmentFilter("Todos"); setSearch("") }}
            style={{ marginLeft: 10, fontSize: 12, color: BLUE, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: TEXT2 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhuma tela encontrada</div>
          <div style={{ fontSize: 13 }}>Tente outros filtros ou limpe a busca</div>
        </div>
      ) : (
        <div className="mkt-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
          {filtered.map(s => {
            const isOnline = s.last_ping && (Date.now() - new Date(s.last_ping).getTime()) < 3 * 60 * 1000
            return (
              <div key={s.id} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "none" }}
              >
                <div style={{ background: "#0A0F1E", height: 100, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32 }}>{segmentIcon(s.segment)}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{s.device_type ?? "TV"}</div>
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 12, display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: isOnline ? GREEN : MUTED }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? GREEN : MUTED, display: "inline-block" }}/>
                    {isOnline ? "Online" : "Ativo"}
                  </div>
                  <div style={{ position: "absolute", top: 10, left: 12, fontSize: 10, fontWeight: 600, color: GREEN, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 8px", borderRadius: 10 }}>
                    ✓ Verificado
                  </div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.client_name ?? s.name?.replace("Tela ", "")}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT2, marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📍 {s.location ?? s.city}
                  </div>
                  <div className="mkt-card-metrics" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Audiência (est.)", value: audienceEstimate(s.plays_30d) ?? "Sem dado" },
                      { label: "CPM (estimado)",   value: cpmEstimate(s.plays_30d) },
                      { label: "Segmento",         value: s.segment },
                    ].map(m => (
                      <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{m.value}</div>
                        <div style={{ fontSize: 9, color: MUTED }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => openModal(s.id, s.client_name ?? s.name?.replace("Tela ","") ?? "", s.city)}
                    style={{ display: "block", width: "100%", background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                    Anunciar nessa tela →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Botão Solicitar proposta (CTA externo) */}
      <div id="marketplace-cta-trigger" style={{ display: "none" }} />
    </div>
  )
}

// Exporta função para abrir modal externamente
export { }
