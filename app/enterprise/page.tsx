// app/enterprise/page.tsx
"use client"
import { useState } from "react"
import Link from "next/link"
import DemoModalButton from "../_components/DemoModalButton"

const BG     = "#080C18"
const SURF   = "#0F1629"
const BORDER = "rgba(255,255,255,0.07)"
const TEXT   = "#F1F5F9"
const TEXT2  = "#94A3B8"
const MUTED  = "#475569"
const BLUE   = "#3B82F6"
const GREEN  = "#10B981"
const PURPLE = "#8B5CF6"
const AMBER  = "#F59E0B"

const CAPABILITIES = [
  {
    icon: "📺",
    title: "Digital Signage em toda a rede",
    desc: "Conteúdo, agenda e campanhas gerenciados de um lugar só, tela por tela ou rede inteira.",
    color: BLUE,
  },
  {
    icon: "💰",
    title: "Retail Media com repasse automático",
    desc: "Cada tela vira uma fonte de receita adicional, com repasse sobre anúncio exibido — direto na conta, sem letra miúda.",
    color: GREEN,
  },
  {
    icon: "🔗",
    title: "Proof-of-Play auditável",
    desc: "Toda exibição registrada de forma imutável, com Merkle root ancorado na blockchain Polygon e certificação ICP Brasil.",
    color: PURPLE,
  },
  {
    icon: "🧭",
    title: "Painel de agência multi-tela",
    desc: "Visão consolidada de todas as telas da rede, por praça e por unidade, num único login.",
    color: AMBER,
  },
]

const FAQ = [
  {
    q: "A partir de quantas telas faz sentido o plano Enterprise?",
    a: "A partir de 5 telas, geralmente redes de lojas, shoppings ou agências que administram telas de terceiros. Com menos telas, os planos Starter/Pro/Business (ver /planos) costumam ser mais diretos.",
  },
  {
    q: "Como funciona o preço?",
    a: "Não é preço de tabela — conversamos sobre quantidade de telas, praças e modelo de repasse pra chegar numa condição que faça sentido pro tamanho da sua rede.",
  },
  {
    q: "Dá pra migrar telas que já são clientes Starter/Pro/Business pro Enterprise?",
    a: "Dá. É só falar com a gente pelo formulário abaixo que a equipe cuida da migração e do onboarding acompanhado.",
  },
  {
    q: "O Proof-of-Play e a auditoria blockchain valem pra rede toda?",
    a: "Sim — cada tela da rede, independente do plano, gera prova auditável. Isso não muda de acordo com o tamanho do contrato.",
  },
]

export default function EnterprisePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        @media (max-width: 768px) {
          .cap-grid { grid-template-columns: 1fr !important; }
          .ent-title { font-size: 28px !important; }
          .cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns a, .cta-btns button { text-align: center !important; width: 100% !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>DOOH<span style={{ color: BLUE }}>PLAY</span></span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/planos" style={{ fontSize: 12, color: TEXT2, textDecoration: "none", padding: "6px 12px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>Planos</Link>
          <Link href="/marketplace" style={{ fontSize: 12, color: TEXT2, textDecoration: "none", padding: "6px 12px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>Marketplace</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: PURPLE, fontWeight: 500, marginBottom: 16 }}>
            🏢 Enterprise
          </div>
          <h1 className="ent-title" style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Leve o DOOHPLAY<br />
            <span style={{ color: PURPLE }}>pra rede toda.</span>
          </h1>
          <p style={{ fontSize: 16, color: TEXT2, maxWidth: 560, margin: "0 auto" }}>
            Pra redes de lojas, shoppings ou agências com mais de 5 telas. Onboarding acompanhado e condições comerciais conversadas caso a caso.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            {["🔗 Blockchain Polygon", "🇧🇷 ICP Brasil", "✅ Proof-of-Play auditável"].map(badge => (
              <span key={badge} style={{ fontSize: 12, color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "5px 12px", background: SURF }}>
                {badge}
              </span>
            ))}
          </div>
          <div className="cta-btns" style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
            <DemoModalButton
              label="Falar com a gente →"
              segment="Enterprise"
              style={{
                background: PURPLE, color: "#fff", borderRadius: 10, padding: "13px 28px",
                fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
              }}
            />
            <Link href="/marketplace" style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 28px", fontSize: 15, textDecoration: "none" }}>
              Ver telas disponíveis
            </Link>
          </div>
        </div>

        {/* CAPACIDADES */}
        <div className="cap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: "3.5rem" }}>
          {CAPABILITIES.map(c => (
            <div key={c.title} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem", display: "flex", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PLANO ENTERPRISE (card) */}
        <div style={{ background: SURF, border: `1px solid ${AMBER}44`, borderRadius: 20, padding: "2.5rem", marginBottom: "3.5rem", boxShadow: `0 0 40px ${AMBER}14` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "inline-block", background: AMBER, color: "#0A0F1E", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, marginBottom: 12 }}>
                Rede / Agência
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Redes maiores</div>
              <div style={{ fontSize: 14, color: TEXT2, marginBottom: 18, maxWidth: 420 }}>
                Pra redes de lojas, shoppings ou agências com mais de 5 telas.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Quantidade de telas sob medida", "Onboarding acompanhado", "Condições comerciais conversadas caso a caso"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT }}>
                    <span style={{ color: GREEN }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: AMBER }}>Fale com a gente</div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>sob medida</div>
              <DemoModalButton
                label="Falar com a gente →"
                segment="Enterprise"
                style={{
                  background: AMBER, color: "#0A0F1E", borderRadius: 10, padding: "12px 24px",
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                }}
              />
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem", textAlign: "center" }}>Perguntas frequentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720, margin: "0 auto" }}>
            {FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={i} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: "1.1rem 1.5rem", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{item.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT2} strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink: 0, marginLeft: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {open && (
                    <div style={{ padding: "0 1.5rem 1.1rem", fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA FINAL */}
        <div style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))`, border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Vamos conversar sobre a sua rede?</h2>
          <p style={{ fontSize: 15, color: TEXT2, marginBottom: 24 }}>Conte quantas telas e onde ficam — a equipe volta com uma proposta em até 2h pelo WhatsApp.</p>
          <div className="cta-btns" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <DemoModalButton
              label="Falar com a gente →"
              segment="Enterprise"
              style={{
                background: PURPLE, color: "#fff", borderRadius: 10, padding: "13px 28px",
                fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
              }}
            />
            <Link href="/planos" style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 28px", fontSize: 15, textDecoration: "none" }}>
              Ver outros planos
            </Link>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "1.5rem", textAlign: "center", fontSize: 12, color: MUTED }}>
        © 2026 DOOHPLAY · <Link href="/trust-center" style={{ color: MUTED, textDecoration: "none" }}>Trust Center</Link> · <Link href="/planos" style={{ color: MUTED, textDecoration: "none" }}>Planos</Link>
      </footer>
    </main>
  )
}
