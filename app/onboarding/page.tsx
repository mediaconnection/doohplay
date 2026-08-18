"use client"

import { useState } from "react"

const BG      = "#0B1020"
const SURFACE = "#111827"
const BORDER  = "#1F2937"
const TEXT    = "#F9FAFB"
const TEXT2   = "#9CA3AF"
const MUTED   = "#4B5563"
const BLUE    = "#3B82F6"
const BLUE2   = "#1D4ED8"
const GREEN   = "#10B981"
const AMBER   = "#F59E0B"
const PURPLE  = "#8B5CF6"
const RED     = "#EF4444"

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: BG, border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: "11px 14px",
  color: TEXT, fontSize: 14, outline: "none",
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: TEXT2, marginBottom: 6, marginTop: 16,
  textTransform: "uppercase", letterSpacing: "0.04em",
}

// Preços e nomes de plano corrigidos em 17/08/2026 pra bater com /planos
// (página pública de preços) e com a ferramenta de assinatura do admin —
// achado da varredura ampla: este arquivo mostrava Starter R$197/Pro R$347/
// Multi R$547, valores e até nome de plano diferentes do resto do site, que
// usa Starter R$97/Pro R$290/Business R$620. Confirmado com o fundador que
// R$97/290/620 é o valor correto. Também removida a claim fixa "Score de
// confiança 100/100" (mesmo padrão de fabricação já corrigido em outras
// páginas nesta sessão — não vem de nenhum dado real).
const PLANS = [
  {
    id: "starter", name: "Starter", price: 97,
    description: "Ideal para começar",
    color: BLUE,
    features: ["1 tela ativa", "Certificado de veiculação mensal", "Portal público de verificação", "Relatório mensal via WhatsApp", "Proof-of-Play auditável"],
    adSpace: "30%", highlight: false,
  },
  {
    id: "pro", name: "Pro", price: 290,
    description: "Mais recursos e visibilidade",
    color: PURPLE,
    features: ["3 telas ativas", "Tudo do Starter", "Conteúdo dinâmico (clima + notícias)", "Relatório de audiência mensal", "Suporte prioritário"],
    adSpace: "40%", highlight: true,
  },
  {
    id: "business", name: "Business", price: 620,
    description: "Para quem tem mais de uma tela no mesmo negócio",
    color: GREEN,
    features: ["Até 5 telas ativas", "Tudo do Pro", "Painel do cliente dedicado", "Relatórios semanais", "Suporte dedicado"],
    adSpace: "50%", highlight: false,
  },
]

const BUSINESS_TYPES = [
  "Academia", "Automotivo", "Bar", "Barbearia", "Cafeteria",
  "Casa & Serviços", "Clínica", "Condomínio", "Farmácia",
  "Lanchonete", "Loja de Roupas", "Padaria", "Pet shop",
  "Restaurante", "Salão de beleza", "Outro",
]

const STEPS = [
  { label: "Estabelecimento", icon: "🏪" },
  { label: "Plano",           icon: "📦" },
  { label: "Contato",         icon: "👤" },
  { label: "Resumo",          icon: "✅" },
]

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function scrollTop() {
  if (typeof window !== "undefined") window.scrollTo(0, 0)
}

export default function OnboardingPage() {
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState("")
  const [result, setResult]   = useState<{ code: string; trial_end: string } | null>(null)

  const [form, setForm] = useState({
    business_name: "", business_type: "", address: "", city: "",
    plan: "pro",
    contact_name: "", email: "", phone: "", cpf_cnpj: "", how_heard: "",
    terms: false,
  })

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setError("")
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.business_name.trim()) { setError("Informe o nome do estabelecimento"); return false }
      if (!form.business_type)        { setError("Selecione o tipo do estabelecimento"); return false }
      if (!form.address.trim())       { setError("Informe o endereço"); return false }
      if (!form.city.trim())          { setError("Informe a cidade"); return false }
    }
    if (step === 2) {
      if (!form.contact_name.trim()) { setError("Informe seu nome"); return false }
      if (!form.email.trim() || !form.email.includes("@")) { setError("Informe um email válido"); return false }
      if (!form.phone.trim() || form.phone.length < 10) { setError("Informe um WhatsApp válido (com DDD)"); return false }
      const digits = form.cpf_cnpj.replace(/\D/g, "")
      if (digits && digits.length !== 11 && digits.length !== 14) {
        setError("CPF deve ter 11 dígitos ou CNPJ 14 dígitos"); return false
      }
    }
    if (step === 3) {
      if (!form.terms) { setError("Aceite os termos para continuar"); return false }
    }
    return true
  }

  function next() { if (!validateStep()) return; setStep(s => s + 1); scrollTop() }
  function back() { setStep(s => s - 1); setError(""); scrollTop() }

  async function submit() {
    if (!validateStep()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar")
      setResult({ code: data.code, trial_end: data.trial_end })
      setDone(true)
    } catch (err: any) {
      setError(err.message || "Erro ao enviar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = PLANS.find(p => p.id === form.plan)!

  if (done && result) {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Cadastro realizado!</div>
          <div style={{ fontSize: 14, color: TEXT2, marginBottom: 24, lineHeight: 1.7 }}>
            Obrigado, <strong style={{ color: TEXT }}>{form.contact_name}</strong>!<br />
            Nossa equipe entrará em contato em até <strong style={{ color: GREEN }}>24 horas</strong> pelo WhatsApp.
          </div>
          <div style={{ background: AMBER + "18", border: `1px solid ${AMBER}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: AMBER, marginBottom: 6 }}>🎁 7 dias grátis ativados!</div>
            <div style={{ fontSize: 12, color: TEXT2 }}>
              A primeira cobrança será apenas no dia <strong style={{ color: TEXT }}>{result.trial_end}</strong>. Cancele quando quiser antes disso.
            </div>
          </div>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1.5rem", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Resumo do pedido</div>
            {[
              { icon: "🏪", text: form.business_name },
              { icon: "📦", text: `Plano ${selectedPlan.name} — R$${selectedPlan.price}/mês` },
              { icon: "📍", text: form.city },
              { icon: "📱", text: form.phone },
            ].map((r, i) => (
              <div key={i} style={{ fontSize: 14, color: TEXT2, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
                {r.icon} <span style={{ color: TEXT }}>{r.text}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>DOOHPLAY — Trust Infrastructure for DOOH Advertising</div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: ${MUTED}; }
        input:focus, select:focus { border-color: ${BLUE} !important; outline: none; }
        select option { background: ${SURFACE}; color: ${TEXT}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${MUTED}; border-radius: 3px; }
      `}</style>

      <header style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: `linear-gradient(135deg,${BLUE},${PURPLE})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: TEXT }}>DOOH</span><span style={{ color: BLUE }}>PLAY</span>
          </span>
        </div>
        <span style={{ fontSize: 12, color: TEXT2 }}>7 dias grátis · Sem cartão agora</span>
      </header>

      <div style={{ background: `linear-gradient(135deg, ${BLUE2} 0%, #0B1020 100%)`, padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Comece em 5 minutos</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, marginBottom: 10, letterSpacing: "-0.02em", lineHeight: 1.3 }}>Coloque uma tela no seu estabelecimento</h1>
        <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7 }}>Publicidade verificada na blockchain · Certificado ICP-Brasil · Relatório mensal automático</p>
      </div>

      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "1.25rem 1.5rem" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-between", position: "relative" }}>
          <div style={{ position: "absolute", top: 15, left: "10%", right: "10%", height: 2, background: BORDER, zIndex: 0 }} />
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                background: i < step ? GREEN : i === step ? BLUE : SURFACE,
                color: i < step || i === step ? "#fff" : MUTED,
                fontWeight: 700, border: `2px solid ${i < step ? GREEN : i === step ? BLUE : BORDER}`,
                transition: "all .2s",
              }}>
                {i < step ? "✓" : s.icon}
              </div>
              <div style={{ fontSize: 10, color: i === step ? BLUE : MUTED, fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.25rem" }}>

        {step === 0 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Seu estabelecimento</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Conte um pouco sobre o seu negócio</div>
            <label style={labelStyle}>Nome do estabelecimento *</label>
            <input style={inputStyle} placeholder="Ex: Lanchonete do João" value={form.business_name} onChange={e => update("business_name", e.target.value)} />
            <label style={labelStyle}>Tipo do estabelecimento *</label>
            <select style={{ ...inputStyle, color: form.business_type ? TEXT : MUTED }} value={form.business_type} onChange={e => update("business_type", e.target.value)}>
              <option value="">Selecione...</option>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={labelStyle}>Endereço *</label>
            <input style={inputStyle} placeholder="Rua, número, bairro" value={form.address} onChange={e => update("address", e.target.value)} />
            <label style={labelStyle}>Cidade *</label>
            <input style={inputStyle} placeholder="São Paulo" value={form.city} onChange={e => update("city", e.target.value)} />
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Escolha seu plano</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Todos incluem 7 dias grátis e certificado ICP-Brasil</div>
            {PLANS.map(plan => (
              <div key={plan.id} onClick={() => update("plan", plan.id)} style={{
                border: `2px solid ${form.plan === plan.id ? plan.color : BORDER}`,
                borderRadius: 14, padding: "1.25rem", marginBottom: 12, cursor: "pointer",
                background: form.plan === plan.id ? plan.color + "12" : SURFACE,
                position: "relative", transition: "all .15s",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -11, right: 16, background: AMBER, color: "#000", fontSize: 10, fontWeight: 800, padding: "2px 12px", borderRadius: 20 }}>MAIS POPULAR</div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{plan.description}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: plan.color }}>R${plan.price}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>/mês</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 10 }}>📺 {plan.adSpace} da tela para anúncios de terceiros</div>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 12, color: TEXT2, padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: GREEN }}>✓</span> {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Seus dados de contato</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Entraremos em contato em até 24 horas</div>
            <label style={labelStyle}>Seu nome completo *</label>
            <input style={inputStyle} placeholder="João Silva" value={form.contact_name} onChange={e => update("contact_name", e.target.value)} />
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" placeholder="joao@email.com" value={form.email} onChange={e => update("email", e.target.value)} />
            <label style={labelStyle}>WhatsApp (com DDD) *</label>
            <input style={inputStyle} type="tel" placeholder="11 99999-9999" value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, ""))} />
            <label style={labelStyle}>CPF ou CNPJ</label>
            <input
              style={inputStyle}
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              value={form.cpf_cnpj}
              onChange={e => update("cpf_cnpj", formatCpfCnpj(e.target.value))}
            />
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Necessário para emissão do boleto/PIX. Pode informar depois.</div>
            <label style={labelStyle}>Como nos conheceu?</label>
            <select style={{ ...inputStyle, color: form.how_heard ? TEXT : MUTED }} value={form.how_heard} onChange={e => update("how_heard", e.target.value)}>
              <option value="">Selecione...</option>
              <option value="indicacao">Indicação de amigo</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="visita">Visita da equipe</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Confirme seu pedido</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Revise os dados antes de enviar</div>
            {[
              { title: "Estabelecimento", color: BLUE, items: [{ icon: "🏪", text: form.business_name, bold: true }, { icon: "🍽", text: form.business_type }, { icon: "📍", text: `${form.address}, ${form.city}` }] },
              { title: "Contato", color: PURPLE, items: [{ icon: "👤", text: form.contact_name, bold: true }, { icon: "📧", text: form.email }, { icon: "📱", text: form.phone }, ...(form.cpf_cnpj ? [{ icon: "🪪", text: form.cpf_cnpj, bold: false }] : [])] },
            ].map(section => (
              <div key={section.title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1.25rem", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: section.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{section.title}</div>
                {section.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: TEXT2, padding: "5px 0", borderBottom: i < section.items.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    {item.icon} <span style={{ color: item.bold ? TEXT : TEXT2, fontWeight: item.bold ? 600 : 400 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ background: BLUE + "12", border: `1px solid ${BLUE}44`, borderRadius: 12, padding: "1.25rem", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Plano selecionado</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedPlan.name}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{selectedPlan.description}</div>
                </div>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: BLUE }}>R${selectedPlan.price}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>/mês</span>
                </div>
              </div>
            </div>
            <div style={{ background: AMBER + "18", border: `1px solid ${AMBER}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 12, fontSize: 12, color: AMBER }}>
              🎁 <strong>7 dias grátis</strong> — primeira cobrança só após a instalação
            </div>
            <div style={{ background: GREEN + "12", border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: GREEN }}>
              ✅ Instalação gratuita · Sem fidelidade · Cancele quando quiser
            </div>
            <div onClick={() => update("terms", !form.terms)} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 8 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                border: `2px solid ${form.terms ? GREEN : BORDER}`,
                background: form.terms ? GREEN : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {form.terms && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>
                Concordo com os <span style={{ color: BLUE }}>termos de serviço</span> e <span style={{ color: BLUE }}>política de privacidade</span> do DOOHPLAY.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: RED + "18", border: `1px solid ${RED}44`, borderRadius: 8, padding: "10px 14px", marginTop: 16, marginBottom: 4, fontSize: 13, color: RED }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button onClick={back} style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", fontSize: 14, fontWeight: 600, color: TEXT2, cursor: "pointer" }}>
              ← Voltar
            </button>
          )}
          {step < 3 ? (
            <button onClick={next} style={{ flex: 2, padding: "13px", borderRadius: 10, border: "none", background: BLUE, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Continuar →
            </button>
          ) : (
            <button onClick={submit} disabled={loading} style={{ flex: 2, padding: "13px", borderRadius: 10, border: "none", background: loading ? MUTED : GREEN, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Enviando..." : "🚀 Iniciar 7 dias grátis"}
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: 11, color: MUTED }}>
            <span>🔐 ICP-Brasil</span>
            <span>⛓ Blockchain</span>
            <span>📋 Certificado mensal</span>
          </div>
        </div>
      </div>
    </main>
  )
}
