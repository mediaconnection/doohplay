// app/planos/page.tsx
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

// Ícone por plano — puramente visual, sem relação com dado real.
function PlanIcon({ id, color }: { id: string; color: string }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  if (id === "starter") return <svg {...common}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  if (id === "pro") return <svg {...common}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  if (id === "business") return <svg {...common}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M14 9h1"/><path d="M14 13h1"/></svg>
  return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 97",
    period: "por mês",
    color: GREEN,
    badge: null,
    desc: "Para comércios locais que querem monetizar sua TV.",
    features: [
      "1 tela conectada",
      "7 dias grátis pra testar",
      "Conteúdo automático",
      "Anúncios de marcas nacionais",
      "40% de repasse sobre receita de anúncio",
      "Dashboard básico",
      "Relatório mensal via WhatsApp",
      "Proof-of-Play auditável",
      "Suporte via WhatsApp",
    ],
    notIncluded: [
      "Múltiplas telas",
      "Relatórios semanais",
      "Suporte prioritário",
    ],
    cta: "Testar 7 dias grátis",
    ctaHref: "/onboarding",
    ctaSecondary: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 290",
    period: "por mês",
    color: BLUE,
    badge: "Mais popular",
    desc: "Para negócios que querem mais controle e receita.",
    features: [
      "3 telas conectadas",
      "7 dias grátis pra testar",
      "Conteúdo personalizado",
      "Campanhas segmentadas",
      "40% de repasse sobre receita de anúncio",
      "Dashboard completo",
      "Relatórios semanais",
      "Proof-of-Play auditável",
      "Suporte prioritário",
    ],
    notIncluded: [
      "Painel de agência",
    ],
    cta: "Testar 7 dias grátis",
    ctaHref: "/onboarding?plano=pro",
    ctaSecondary: false,
  },
  {
    id: "business",
    name: "Business",
    price: "R$ 620",
    period: "por mês",
    color: PURPLE,
    badge: null,
    desc: "Para quem tem mais de uma tela no mesmo negócio.",
    features: [
      "Até 5 telas conectadas",
      "7 dias grátis pra testar",
      "Conteúdo personalizado por tela",
      "Campanhas segmentadas",
      "40% de repasse sobre receita de anúncio",
      "Dashboard completo",
      "Relatórios semanais",
      "Proof-of-Play auditável",
      "Suporte dedicado",
    ],
    notIncluded: [],
    cta: "Testar 7 dias grátis",
    ctaHref: "/onboarding?plano=business",
    ctaSecondary: false,
  },
  {
    id: "enterprise",
    name: "Redes maiores",
    price: "Fale com a gente",
    period: "sob medida",
    color: AMBER,
    badge: "Rede / Agência",
    desc: "Pra redes de lojas, shoppings ou agências com mais de 5 telas.",
    features: [
      "Quantidade de telas sob medida",
      "Onboarding acompanhado",
      "Condições comerciais conversadas caso a caso",
    ],
    notIncluded: [],
    cta: "Falar com a gente",
    ctaHref: "/marketplace?demo=1",
    ctaSecondary: true,
  },
]

const FAQ = [
  {
    q: "Como funciona o teste grátis de 7 dias?",
    a: "Você instala o app DOOHPLAY na sua TV, conecta à internet e já começa a receber anúncios. Os primeiros 7 dias não custam nada — a primeira cobrança só acontece depois disso, e você pode cancelar antes sem pagar nada.",
  },
  {
    q: "Quanto vou ganhar de repasse de anúncio?",
    a: "40% da receita bruta de cada campanha exibida na sua tela é repassado pra você, em qualquer plano. Depende da localização, fluxo de pessoas e horário de funcionamento quanto de anúncio sua tela vai atrair.",
  },
  {
    q: "O que é o Proof-of-Play?",
    a: "É o registro de cada exibição feita na sua tela — data, hora e conteúdo exibido — auditável e certificado via blockchain com ICP Brasil. É a garantia de que o anúncio foi mesmo exibido, não simulado.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim, a qualquer momento, sem multa. Se cancelar dentro dos 7 dias de teste, não paga nada.",
  },
  {
    q: "Que tipo de TV funciona?",
    a: "Qualquer TV com Android TV ou um dispositivo Android conectado via HDMI (Fire Stick, box Android, etc), com acesso à internet.",
  },
  {
    q: "E se eu precisar de mais telas do que meu plano cobre?",
    a: "Dá pra comprar uma tela extra avulsa a qualquer momento pelo seu painel, ou mudar de plano — o Business cobre até 3 telas. Pra redes maiores, fale com a gente.",
  },
]

export default function PlanosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        @media (max-width: 768px) {
          .plans-grid { grid-template-columns: 1fr !important; }
          .compare-table { font-size: 11px !important; }
          .plans-title { font-size: 28px !important; }
          .cta-btns { flex-direction: column !important; align-items: stretch !important; }
          .cta-btns a { text-align: center !important; }
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
          <Link href="/marketplace" style={{ fontSize: 12, color: TEXT2, textDecoration: "none", padding: "6px 12px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>Marketplace</Link>
          <Link href="/onboarding" style={{ fontSize: 12, color: "#fff", textDecoration: "none", padding: "6px 14px", background: BLUE, borderRadius: 8, fontWeight: 600 }}>Instalar Tela</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: BLUE, fontWeight: 500, marginBottom: 16 }}>
            💰 Planos e Preços
          </div>
          <h1 className="plans-title" style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Simples, transparente,<br />
            <span style={{ color: BLUE }}>sem surpresas.</span>
          </h1>
          <p style={{ fontSize: 16, color: TEXT2, maxWidth: 520, margin: "0 auto" }}>
            7 dias grátis pra testar. Depois, assinatura simples — sem letra miúda.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            {["🔗 Blockchain Polygon", "🇧🇷 ICP Brasil", "✅ Proof-of-Play auditável"].map(badge => (
              <span key={badge} style={{ fontSize: 12, color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "5px 12px", background: SURF }}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* PLANOS */}
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: "4rem" }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: SURF,
              border: `1px solid ${plan.badge === "Mais popular" ? plan.color + "44" : BORDER}`,
              borderRadius: 20,
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow: plan.badge === "Mais popular" ? `0 0 40px ${plan.color}18` : "none",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: plan.color + "18", marginBottom: 14,
                }}>
                  <PlanIcon id={plan.id} color={plan.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", marginBottom: 4 }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: MUTED }}>{plan.period}</div>
                <div style={{ fontSize: 13, color: TEXT2, marginTop: 12, lineHeight: 1.5 }}>{plan.desc}</div>
              </div>

              <div style={{ flex: 1, marginBottom: "1.5rem" }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: TEXT }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
                {plan.notIncluded.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: MUTED }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {f}
                  </div>
                ))}
              </div>

              {plan.ctaSecondary ? (
                <DemoModalButton
                  label={plan.cta + " →"}
                  segment="Enterprise"
                  style={{
                    display: "block", width: "100%", textAlign: "center", padding: "13px",
                    borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    background: "transparent", color: plan.color,
                    border: `1px solid ${plan.color}`,
                  }}
                />
              ) : (
                <Link href={plan.ctaHref} style={{
                  display: "block", textAlign: "center", padding: "13px",
                  borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none",
                  background: plan.color, color: "#fff",
                  border: `1px solid ${plan.color}`,
                }}>
                  {plan.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* COMPARATIVO */}
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: "4rem" }}>
          <div style={{ padding: "1.5rem", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Comparativo completo</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: TEXT2, fontWeight: 600 }}>Recurso</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ padding: "12px 20px", textAlign: "center", fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Telas conectadas",        "1",        "3",           "Até 5",       "Sob medida"],
                  ["Teste grátis",            "7 dias",   "7 dias",      "7 dias",      "—"],
                  ["Proof-of-Play",           "✓",        "✓",           "✓",           "✓"],
                  ["Blockchain auditável",    "✓",        "✓",           "✓",           "✓"],
                  ["ICP Brasil",              "✓",        "✓",           "✓",           "✓"],
                  ["Repasse de anúncio",      "40%",      "40%",         "40%",         "A combinar"],
                  ["Dashboard",               "Básico",   "Completo",    "Completo",    "Sob medida"],
                  ["Relatórios",              "Mensal",   "Semanal",     "Semanal",     "Sob medida"],
                  ["Painel de agência",       "—",        "—",           "—",           "✓"],
                  ["Suporte",                 "WhatsApp", "Prioritário", "Dedicado",    "Dedicado"],
                ].map(([feature, ...values], i) => (
                  <tr key={feature} style={{ borderBottom: i < 9 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: TEXT2 }}>{feature}</td>
                    {values.map((v, j) => (
                      <td key={j} style={{ padding: "12px 20px", textAlign: "center", fontSize: 13, color: v === "—" ? MUTED : TEXT, fontWeight: v === "✓" ? 600 : 400 }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
        <div style={{ background: `linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))`, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Pronto para começar?</h2>
          <p style={{ fontSize: 15, color: TEXT2, marginBottom: 24 }}>Instale e teste grátis por 7 dias em menos de 5 minutos. Sem cartão de crédito agora.</p>
          <div className="cta-btns" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/onboarding" style={{ background: BLUE, color: "#fff", borderRadius: 10, padding: "13px 28px", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
              Testar 7 Dias Grátis →
            </Link>
            <Link href="/marketplace" style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 28px", fontSize: 15, textDecoration: "none" }}>
              Ver Marketplace
            </Link>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "1.5rem", textAlign: "center", fontSize: 12, color: MUTED }}>
        © 2026 DOOHPLAY · <Link href="/trust-center" style={{ color: MUTED, textDecoration: "none" }}>Trust Center</Link> · <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacidade</Link>
      </footer>
    </main>
  )
}
