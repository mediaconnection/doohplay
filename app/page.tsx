"use client"

import { useState } from "react"
import Link from "next/link"

const NAV_LINKS = [
  { label: "Instalar Tela", href: "/install" },
  { label: "Planos",        href: "/planos" },
  { label: "Enterprise",    href: "/enterprise" },
  { label: "Trust Center",  href: "/trust-center" },
  { label: "ProofChain",    href: "/proofchain" },
  { label: "Network Center",href: "/noc" },
]

const TAGS = ["Digital Signage", "Retail Media", "Blockchain", "ICP Brasil", "ProofChain", "Trust Score"]

const SEGMENTS = [
  { icon: "🍞", label: "Padarias" },
  { icon: "☕", label: "Cafeterias" },
  { icon: "🍔", label: "Restaurantes" },
  { icon: "💊", label: "Farmácias" },
  { icon: "🏋", label: "Academias" },
  { icon: "🏪", label: "Franquias" },
  { icon: "📢", label: "Agências" },
  { icon: "🛒", label: "Supermercados" },
  { icon: "🏬", label: "Shoppings" },
  { icon: "🏢", label: "Redes Varejistas" },
]

const FEATURES = [
  { icon: "📺", title: "Digital Signage",         desc: "Transforme qualquer TV em uma tela profissional gerenciada remotamente. Conteúdo automático, promoções e anúncios." },
  { icon: "💰", title: "Retail Media",             desc: "Monetize suas telas com anúncios de marcas nacionais. Revenue share automático direto na sua conta." },
  { icon: "🛡",  title: "Proof-of-Play Auditável", desc: "Cada exibição registrada na blockchain com certificação ICP Brasil. Auditável em tempo real." },
  { icon: "🔗", title: "ProofChain",               desc: "Explorer de blockchain próprio. Cada evento tem TX hash, Merkle Root e certificado criptográfico." },
  { icon: "📊", title: "Analytics em tempo real", desc: "Impressões, reach, CPM, Trust Score e SLA monitorados ao vivo. Dashboard por tela, região e campanha." },
  { icon: "🌐", title: "Rede Nacional",            desc: "Telas em todo o Brasil. De São Paulo a Manaus. Inventário verificado e auditável." },
]

const PERSONAS = [
  {
    badge: "Mais popular",
    badgeColor: "#10B981",
    tag: "COMÉRCIO LOCAL",
    title: "Transforme sua TV em uma fonte de renda.",
    stats: [
      { value: "R$847", label: "Receita" },
      { value: "99.2%", label: "TV Online" },
      { value: "3",     label: "Anúncios" },
    ],
    features: ["Monetize sua TV", "Conteúdo automático", "Pagamentos garantidos", "Gestão simples"],
    cta: "Começar Agora",
    ctaColor: "#10B981",
    href: "/onboarding",
  },
  {
    badge: "Recomendado",
    badgeColor: "#3B82F6",
    tag: "REDE DE LOJAS",
    title: "Gerencie todas as telas da sua rede.",
    stats: [
      { value: "24",     label: "Telas" },
      { value: "8",      label: "Unidades" },
      { value: "R$12.4K", label: "Receita" },
    ],
    features: ["Gestão centralizada", "Campanhas por região", "Relatórios", "SLA operacional"],
    cta: "Gerenciar Rede",
    ctaColor: "#3B82F6",
    href: "/enterprise",
  },
  {
    badge: "Enterprise",
    badgeColor: "#8B5CF6",
    tag: "AGÊNCIA / ANUNCIANTE",
    title: "Compre mídia com Proof-of-Play auditável.",
    stats: [
      { value: "4.2M",  label: "Impressões" },
      { value: "98.7%", label: "SLA" },
      { value: "97.3",  label: "Trust" },
    ],
    features: ["Proof-of-Play", "Blockchain", "ICP Brasil", "APIs"],
    cta: "Acessar Enterprise",
    ctaColor: "#8B5CF6",
    href: "/enterprise",
  },
]

const TRUST_BADGES = [
  { label: "ICP Brasil A3",      color: "#10B981" },
  { label: "Blockchain Polygon", color: "#3B82F6" },
  { label: "LGPD Compliance",    color: "#F59E0B" },
  { label: "Trust Score auditável", color: "#10B981" },
]

// ─── Modal Solicitar Demo ─────────────────────────────────────────────────────
function ModalDemo({ onClose }: { onClose: () => void }) {
  const [form, setForm]     = useState({ name: "", company: "", phone: "", segment: "" })
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState("")

  const SEGMENTS_DEMO = [
    "Comércio Local", "Rede de Lojas", "Shopping", "Agência",
    "Anunciante", "Franquia", "Outro",
  ]

  const handleSubmit = async () => {
    if (!form.name.trim())    { setError("Informe seu nome."); return }
    if (!form.phone.trim() || form.phone.replace(/\D/g,"").length < 10) {
      setError("Informe um WhatsApp válido com DDD."); return
    }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setDone(true)
    } catch {
      setError("Erro ao enviar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, width: "100%", maxWidth: 480,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>Solicitar Demonstração</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>Nossa equipe entra em contato em até 2 horas pelo WhatsApp</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#F9FAFB", marginBottom: 8 }}>Solicitação enviada!</div>
              <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
                Obrigado, <strong style={{ color: "#F9FAFB" }}>{form.name}</strong>!<br />
                Nossa equipe vai entrar em contato pelo WhatsApp em até <strong style={{ color: "#10B981" }}>2 horas</strong>.
              </div>
              <button onClick={onClose} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seu nome *</label>
                <input
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError("") }}
                  placeholder="João Silva"
                  style={{ width: "100%", boxSizing: "border-box", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Empresa / Negócio</label>
                <input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Nome da empresa ou rede"
                  style={{ width: "100%", boxSizing: "border-box", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>WhatsApp (com DDD) *</label>
                <input
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,"") })); setError("") }}
                  placeholder="11 99999-9999"
                  type="tel"
                  style={{ width: "100%", boxSizing: "border-box", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: "#F9FAFB", fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Segmento</label>
                <select
                  value={form.segment}
                  onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "#0B1020", border: "1px solid #1F2937", borderRadius: 8, padding: "11px 14px", color: form.segment ? "#F9FAFB" : "#6B7280", fontSize: 14, outline: "none" }}
                >
                  <option value="">Selecione seu segmento…</option>
                  {SEGMENTS_DEMO.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#EF4444" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? "#374151" : "#3B82F6", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Enviando…" : "Solicitar Demo →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#4B5563" }}>
                📱 Resposta em até 2h pelo WhatsApp · Sem compromisso
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <main style={{ minHeight: "100vh", background: "#080C18", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {showDemo && <ModalDemo onClose={() => setShowDemo(false)} />}
      <style>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-bar { padding: 0 1rem !important; gap: 8px !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; padding: 3rem 1rem 2rem !important; }
          .hero-title { font-size: 28px !important; line-height: 1.15 !important; }
          .hero-btns { flex-direction: column !important; }
          .hero-btns a, .hero-btns button { width: 100% !important; justify-content: center !important; box-sizing: border-box !important; }
          .hero-tags { display: none !important; }
          .hero-dashboard { display: none !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .personas-grid { grid-template-columns: 1fr !important; }
          .network-grid { grid-template-columns: 1fr !important; }
          .monetize-grid { grid-template-columns: 1fr !important; }
          .trust-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns a, .cta-btns button { text-align: center !important; }
          .explorer-table { overflow-x: auto !important; }
          .explorer-table > div { min-width: 520px !important; }
          .trust-banner { flex-direction: column !important; gap: 12px !important; }
          .trust-badges { flex-wrap: wrap !important; }
          .section-pad { padding: 3rem 1rem !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 2rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>DOOH<span style={{ color: "#3B82F6" }}>PLAY</span></span>
        </div>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {NAV_LINKS.map(link => (
            <Link key={link.label} href={link.href} style={{ padding: "6px 12px", fontSize: 13, color: "#94A3B8", textDecoration: "none", borderRadius: 8, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" style={{ padding: "8px 16px", fontSize: 13, color: "#94A3B8", textDecoration: "none", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            Entrar
          </Link>
          <Link href="/onboarding" style={{ padding: "8px 16px", fontSize: 13, color: "#fff", textDecoration: "none", borderRadius: 8, background: "#3B82F6", fontWeight: 600 }}>
            Instalar uma Tela
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 2rem 3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
        <div>
          <div className="hero-tags" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
            {TAGS.map(tag => (
              <span key={tag} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#3B82F6", fontWeight: 500 }}>
                ✓ {tag}
              </span>
            ))}
          </div>
          <h1 className="hero-title" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            Transforme qualquer TV em uma plataforma de{" "}
            <span style={{ color: "#3B82F6" }}>conteúdo, publicidade e receita.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1.6, margin: "0 0 2rem", maxWidth: 500 }}>
            Digital Signage, Retail Media e Proof-of-Play Auditável em uma única plataforma Enterprise.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
            <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: 8, background: "#3B82F6", color: "#fff", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Instalar uma Tela →
            </Link>
            {/* ✅ Botão corrigido — abre modal em vez de /enterprise */}
            <button
              onClick={() => setShowDemo(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "#fff", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Solicitar Demonstração
            </button>
          </div>
          <Link href="#video" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Assistir Vídeo
          </Link>
        </div>

        {/* Hero Dashboard */}
        <div className="hero-dashboard" style={{ position: "relative" }}>
          <div style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#10B981" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} /> Painel DOOHPLAY
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1rem" }}>
              {[
                { value: "Blockchain", label: "Prova auditável", color: "#3B82F6" },
                { value: "ICP Brasil", label: "Timestamp certificado", color: "#10B981" },
                { value: "Ativo",   label: "Proof-of-Play", color: "#10B981" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>Receita Mensal (R$ M)</div>
            <div style={{ height: 60, background: "rgba(59,130,246,0.05)", borderRadius: 8, overflow: "hidden", position: "relative", marginBottom: "1rem" }}>
              <svg width="100%" height="100%" viewBox="0 0 300 60" preserveAspectRatio="none">
                <polyline points="0,50 50,40 100,35 150,28 200,20 250,15 300,8" fill="none" stroke="#3B82F6" strokeWidth="2"/>
                <polygon points="0,50 50,40 100,35 150,28 200,20 250,15 300,8 300,60 0,60" fill="rgba(59,130,246,0.1)"/>
              </svg>
            </div>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>ProofChain</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>0x7f2a...c4e1 · Verificado · Bloco #18.2M</div>
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", top: -20, right: -20, background: "#12182B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Retail Media</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>Repasse automático</div>
          </div>
        </div>
      </section>

      {/* QUEM USA */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Utilizado por negócios em todo o Brasil</h2>
          <p style={{ fontSize: 16, color: "#64748B" }}>De padarias locais a redes varejistas nacionais.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {SEGMENTS.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0F1629", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 40, padding: "10px 20px", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#CBD5E1" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* REDE NACIONAL */}
      <section style={{ background: "#0A0F1E", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#3B82F6", fontWeight: 500, marginBottom: 16 }}>
              🌐 Network Operations Center
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Rede Nacional em Tempo Real</h2>
            <p style={{ fontSize: 16, color: "#64748B" }}>Monitoramento operacional de toda a infraestrutura DOOHPLAY.</p>
          </div>
          <div className="network-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            <div style={{ background: "#080C18", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "2rem", minHeight: 340, position: "relative", overflow: "hidden" }}>
              <svg viewBox="0 0 600 500" style={{ width: "100%", height: 300, opacity: 0.15 }} fill="none">
                <path d="M200,80 L280,60 L360,80 L420,140 L440,220 L420,300 L380,360 L320,400 L260,420 L200,400 L160,340 L140,260 L150,180 Z" stroke="#3B82F6" strokeWidth="1.5" fill="rgba(59,130,246,0.05)"/>
              </svg>
              {[
                { city: "São Paulo",     x: "52%", y: "68%" },
                { city: "Rio de Janeiro",x: "62%", y: "60%" },
                { city: "Belo Horizonte",x: "55%", y: "55%" },
                { city: "Curitiba",      x: "50%", y: "76%" },
                { city: "Brasília",      x: "55%", y: "44%" },
                { city: "Salvador",      x: "68%", y: "38%" },
                { city: "Fortaleza",     x: "72%", y: "22%" },
                { city: "Manaus",        x: "28%", y: "20%" },
              ].map(c => (
                <div key={c.city} style={{ position: "absolute", left: c.x, top: c.y, transform: "translate(-50%,-50%)" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#3B82F620", border: "2px solid #3B82F6" }} />
                  {c.city === "São Paulo" && <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 2, whiteSpace: "nowrap" }}>{c.city}</div>}
                </div>
              ))}
              <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 12, fontSize: 10 }}>
                {[["#10B981","Online"],["#3B82F6","Verified"],["#F59E0B","Warning"],["#EF4444","Offline"]].map(([c,l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748B" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ background: "#080C18", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>O que o Network Center mostra</div>
                <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
                  Status online/offline, Trust Score e SLA por praça, atualizados a partir dos dados reais de cada tela conectada.
                </div>
              </div>
              {[
                "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Curitiba", "Porto Alegre",
              ].map((city, i) => (
                <div key={city} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 1.5rem", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>{city}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>ver ao vivo →</span>
                </div>
              ))}
              <div style={{ padding: "12px 1.5rem" }}>
                <Link href="/network/map" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#3B82F6", color: "#fff", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  🌐 Abrir Network Center →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MONETIZE */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Monetize suas telas automaticamente.</h2>
          <p style={{ fontSize: 16, color: "#64748B" }}>Anunciantes nacionais chegam diretamente na sua tela.</p>
        </div>
        <div className="monetize-grid" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "📺", label: "Repasse de anúncio",  value: "40%",        sub: "Sobre cada campanha exibida", color: "#10B981" },
              { icon: "🔗", label: "Pagamento",           value: "Automático", sub: "Direto na sua conta, todo mês", color: "#3B82F6" },
              { icon: "🌐", label: "Condições",           value: "Sem letra miúda", sub: "Cancele quando quiser",   color: "#8B5CF6" },
            ].map(r => (
              <div key={r.label} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: `${r.color}15`, border: `1px solid ${r.color}30`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: r.color, letterSpacing: "-0.02em" }}>{r.value}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{r.sub}</div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#0A0F1E", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Tecnologia de ponta. Simplicidade na prática.</h2>
            <p style={{ fontSize: 16, color: "#64748B" }}>Do pequeno comércio à agência global — tudo em uma plataforma.</p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.5rem" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Como você pretende utilizar o DOOHPLAY?</h2>
          <p style={{ fontSize: 16, color: "#64748B" }}>Escolha a experiência ideal para seu negócio.</p>
        </div>
        <div className="personas-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {PERSONAS.map(p => (
            <div key={p.tag} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ background: p.badgeColor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{p.badge}</span>
                <span style={{ fontSize: 11, color: p.badgeColor, fontWeight: 600 }}>● {p.tag}</span>
              </div>
              <div style={{ background: "#080C18", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {p.stats.map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: p.badgeColor }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "70%", background: p.badgeColor, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: "1rem", lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ flex: 1, marginBottom: "1.5rem" }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: "#CBD5E1" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.badgeColor} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
              <Link href={p.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: p.badgeColor, color: "#fff", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST CENTER */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#3B82F6", fontWeight: 500, marginBottom: 16 }}>
            🛡 Trust Center
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Confiança verificável.</h2>
          <p style={{ fontSize: 16, color: "#64748B" }}>Trust Score calculado por tela, com auditoria pública e certificação ICP Brasil.</p>
        </div>
        <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="16"/>
              <circle cx="100" cy="100" r="80" fill="none" stroke="#3B82F6" strokeWidth="16"
                strokeDasharray={`${0.85 * 502} ${502}`} strokeLinecap="round"
                transform="rotate(-90 100 100)" opacity={0.5}/>
              <text x="100" y="95" textAnchor="middle" fill="#F1F5F9" fontSize="20" fontWeight="800">Por tela</text>
              <text x="100" y="118" textAnchor="middle" fill="#64748B" fontSize="12">TRUST SCORE</text>
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 280, margin: "16px auto 0" }}>
              {[
                { label: "Assinatura ICP", value: "A3 Ativo",   color: "#10B981" },
                { label: "Blockchain",     value: "Sync",       color: "#10B981" },
                { label: "Merkle Root",    value: "Verified",   color: "#10B981" },
                { label: "SLA",            value: "Monitorado", color: "#10B981" },
                { label: "Auditoria",      value: "Pública",    color: "#3B82F6" },
                { label: "LGPD",           value: "Compliance", color: "#F59E0B" },
              ].map(b => (
                <div key={b.label} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{b.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { icon: "🛡", label: "Trust Score",     value: "Por tela",    color: "#3B82F6" },
                { icon: "✅", label: "Provas",           value: "Auditáveis", color: "#10B981" },
                { icon: "📈", label: "SLA",              value: "Monitorado", color: "#10B981" },
                { icon: "👁", label: "Auditável",        value: "100%",       color: "#8B5CF6" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0F1629", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <Link href="/trust-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#3B82F6", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              🛡 Abrir Trust Center →
            </Link>
          </div>
        </div>
      </section>

      {/* PROOFCHAIN EXPLORER */}
      <section style={{ background: "#080C18", padding: "5rem 2rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#6366F1", fontWeight: 500, marginBottom: 16 }}>
              🔗 ProofChain Explorer
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Cada prova verificável por qualquer pessoa.</h2>
            <p style={{ fontSize: 16, color: "#64748B" }}>Blockchain público · Polygon · ICP Brasil</p>
          </div>
          <div style={{ maxWidth: 800, margin: "0 auto 2rem", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#0F1629", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#475569" }}>
              🔍 Pesquisar hash, tela ou campanha...
            </div>
            <Link href="/explorer" style={{ background: "#6366F1", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              Verificar hash
            </Link>
          </div>
          <div className="explorer-table" style={{ background: "#0A0F1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span>Hash</span><span>Tela</span><span>Bloco</span><span>Status</span>
            </div>
            {[
              { hash: "0x7f2a...c4e1", tela: "SP-Centro-01", bloco: "#18,241,872", status: "Verificado", ok: true  },
              { hash: "0x3b9c...f8d2", tela: "RJ-Copac-04",  bloco: "#18,241,871", status: "Verificado", ok: true  },
              { hash: "0xac4f...1e73", tela: "BH-Savas-02",  bloco: "#18,241,870", status: "Verificado", ok: true  },
              { hash: "0x2d8e...9b51", tela: "BSB-Pilot-07", bloco: "#18,241,869", status: "Pendente",   ok: false },
              { hash: "0xf71b...4c29", tela: "CTB-Agua-03",  bloco: "#18,241,868", status: "Verificado", ok: true  },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr", padding: "13px 20px", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#6366F1", fontFamily: "monospace" }}>{row.hash}</span>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{row.tela}</span>
                <span style={{ fontSize: 13, color: "#64748B" }}>{row.bloco}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: row.ok ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: row.ok ? "#10B981" : "#F59E0B", display: "inline-block" }}>
                  {row.ok ? "✓ " : "⏳ "}{row.status}
                </span>
              </div>
            ))}
            <div style={{ padding: "14px 20px", textAlign: "center" }}>
              <Link href="/explorer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366F1", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                🔗 Abrir Explorer Completo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES BANNER */}
      <section style={{ background: "#080C18", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem 2rem" }}>
        <div className="trust-banner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Proof-of-Play Auditável com ICP Brasil & Blockchain</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>Cada exibição registrada de forma imutável. Trust Score em tempo real. LGPD compliance.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {TRUST_BADGES.map(b => (
              <span key={b.label} style={{ background: `${b.color}15`, border: `1px solid ${b.color}40`, borderRadius: 20, padding: "6px 14px", fontSize: 12, color: b.color, fontWeight: 600, whiteSpace: "nowrap" }}>
                ✓ {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "6rem 2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#3B82F6", marginBottom: "1.5rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
          Rede em operação agora
        </div>
        <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px" }}>Comece a monetizar sua TV hoje.</h2>
        <p style={{ fontSize: 18, color: "#64748B", margin: "0 0 2rem" }}>7 dias grátis pra testar. Sem cartão de crédito agora.</p>
        <div className="cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <Link href="/onboarding" style={{ display: "flex", alignItems: "center", gap: 8, background: "#3B82F6", color: "#fff", padding: "16px 32px", borderRadius: 14, fontSize: 16, fontWeight: 700, textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Testar 7 Dias Grátis →
          </Link>
          {/* ✅ CTA final também corrigido */}
          <button
            onClick={() => setShowDemo(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "#fff", padding: "16px 32px", borderRadius: 14, fontSize: 16, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Solicitar Demo Enterprise
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#080C18", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "3rem 2rem 2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800 }}>DOOH<span style={{ color: "#3B82F6" }}>PLAY</span></span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, maxWidth: 280 }}>
                Digital Signage, Retail Media e Proof-of-Play Auditável em uma única plataforma Enterprise.
              </p>
            </div>
            {[
              { title: "PLATAFORMA",    links: ["Instalar Tela", "Planos", "Enterprise", "AI Revenue"] },
              { title: "SEGURANÇA",     links: ["Trust Center", "ProofChain Explorer", "Status da Rede", "Relatórios"] },
              { title: "CERTIFICAÇÕES", links: ["ICP Brasil A3", "Blockchain Polygon", "LGPD Compliance"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{col.title}</div>
                {col.links.map(link => (
                  <div key={link} style={{ fontSize: 13, color: "#64748B", marginBottom: 8, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
                  >{link}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#334155" }}>
            <span>© 2026 DOOHPLAY. Todos os direitos reservados.</span>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "#10B981" }}>↑ Status da rede monitorado</span>
              <span>LGPD Compliance</span>
              <span>ICP Brasil</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
