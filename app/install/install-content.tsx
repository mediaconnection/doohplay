"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "checking" | "found" | "invalid" | "ready" | "pending" | "confirming"

const STEPS = [
  { id: 1, label: "Conectar TV",        desc: "Conecte a TV à internet e abra o app" },
  { id: 2, label: "Validar Código",     desc: "Digite o código de 6 dígitos exibido na tela" },
  { id: 3, label: "Registrar Tela",     desc: "Sua tela será registrada na plataforma" },
  { id: 4, label: "Sincronizar Conteúdo", desc: "Playlist e configurações sendo baixadas" },
  { id: 5, label: "Tela Ativa",         desc: "Pronta para exibir conteúdo e anúncios" },
]

const BENEFITS = [
  { icon: "💵", label: "Ganhe com anúncios",      desc: "Receba pagamentos mensais por exibir anúncios na sua TV" },
  { icon: "⚡", label: "Conteúdo automatizado",   desc: "Receba vídeos, promoções e notícias sem precisar fazer nada" },
  { icon: "📡", label: "Gestão remota",            desc: "Controle sua tela de qualquer lugar pelo celular ou computador" },
  { icon: "🔗", label: "Proof-of-Play",            desc: "Cada exibição é registrada e auditável para máxima confiança" },
]

// ─── Colors ───────────────────────────────────────────────────────────────────

// Paleta alinhada à marca DOOHPLAY usada nas outras páginas (landing,
// planos, trust-center, enterprise) — mesmo azul/verde, só que sobre
// fundo claro nesta tela de ativação.
const C = {
  bg:      "#F8FAFC",
  white:   "#FFFFFF",
  blue:    "#3B82F6",
  blueLt:  "#EFF6FF",
  blueBd:  "#BFDBFE",
  green:   "#10B981",
  greenLt: "#DCFCE7",
  greenBd: "#86EFAC",
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  spinner: "#3B82F6",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 14, color = C.blue }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="40 20" strokeLinecap="round" />
    </svg>
  )
}

function Check({ size = 14, color = C.green }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gray400} strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function WifiIcon({ color = C.blue }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M10.54 16.1a6 6 0 0 1 2.92 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InstallContent() {
  const searchParams = useSearchParams()
  const screenId     = searchParams.get("screen") || ""
  const codeParam    = searchParams.get("code")?.toUpperCase() || ""

  const [status, setStatus]         = useState<Status>("checking")
  const [activeStep, setActiveStep] = useState(0)
  const [clientName, setClientName] = useState("")
  const [copied, setCopied]         = useState<"id" | "code" | null>(null)

  // Derived display values
  const displayId   = screenId || "SCR-2024-00847"
  const displayCode = codeParam || "DHP-847-293"

  const playerUrl = screenId
    ? `https://doohplay-demo.onrender.com/player?screen=${screenId}`
    : `https://doohplay-demo.onrender.com/player?screen=YOUR_ID`
  const apkDownloadUrl = "/downloads/doohplay-player-native.apk"

  // ── Validation flow ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!codeParam && !screenId) { setStatus("pending"); return }
    const t = setTimeout(async () => {
      try {
        if (codeParam) {
          const res  = await fetch(`/api/studio/auth?code=${codeParam}`)
          const data = await res.json()
          if (data.ok) {
            setClientName(data.client?.name || codeParam)
            setStatus("found")
            advanceSteps()
          } else {
            setStatus("invalid")
          }
        } else {
          setStatus("found")
          advanceSteps()
        }
      } catch { setStatus("pending") }
    }, 900)
    return () => clearTimeout(t)
  }, [codeParam, screenId])

  function advanceSteps() {
    let s = 0
    const adv = setInterval(() => {
      s++; setActiveStep(s)
      if (s >= 4) { clearInterval(adv); setStatus("ready") }
    }, 600)
  }

  // ── Copy helper ──────────────────────────────────────────────────────────
  const copy = useCallback((val: string, which: "id" | "code") => {
    navigator.clipboard.writeText(val).catch(() => {})
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  // ── Step icon ────────────────────────────────────────────────────────────
  function StepIcon({ index }: { index: number }) {
    const done    = activeStep > index
    const active  = activeStep === index
    const pending = activeStep < index

    if (done)    return <div style={stepCircle(C.green, C.greenLt, C.greenBd)}><Check size={12} color={C.green} /></div>
    if (active)  return <div style={stepCircle(C.blue,  C.blueLt,  C.blueBd)}><Spinner size={12} color={C.blue} /></div>
    return <div style={stepCircle(C.gray400, C.gray100, C.gray200)}><span style={{ fontSize: 11, color: C.gray400, fontWeight: 600 }}>{index + 1}</span></div>
  }

  function stepCircle(color: string, bg: string, border: string) {
    return {
      width: 22, height: 22, borderRadius: "50%",
      background: bg, border: `1.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    } as React.CSSProperties
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.gray900, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.gray200}`,
        padding: "0 1.5rem", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: C.gray900 }}>DOOHPLAY</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.gray500 }}>Precisa de ajuda?</span>
          <a href="https://wa.me/5511962050987" style={{ fontSize: 13, fontWeight: 600, color: C.blue, textDecoration: "none" }}>
            Falar com suporte
          </a>
        </div>
      </nav>

      {/* ── LAYOUT ── */}
      <div style={{
        maxWidth: 1080, margin: "0 auto", padding: "3rem 1.5rem",
        display: "grid", gridTemplateColumns: "1fr 400px", gap: "3rem", alignItems: "start",
      }}>

        {/* ══ LEFT COLUMN ══ */}
        <div>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <div style={{ width: 16, height: 16, background: C.blueLt, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
              </svg>
            </div>
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 500 }}>Ativação de Tela</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 12px", color: C.gray900 }}>
            Ative sua Tela no DOOHPLAY
          </h1>
          <p style={{ fontSize: 15, color: C.gray500, lineHeight: 1.65, maxWidth: 460, margin: "0 0 2.5rem" }}>
            Conecte sua TV, valide o código e comece a exibir conteúdo em poucos minutos.
          </p>

          {/* TV Preview card */}
          <div style={{
            background: C.white, border: `1px solid ${C.gray200}`,
            borderRadius: 20, padding: "1.5rem", marginBottom: "1.75rem",
            position: "relative", overflow: "hidden",
          }}>
            {/* Android TV badge */}
            <div style={{ position: "absolute", top: 16, right: 16, background: C.gray900, color: C.white, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
              Android TV
            </div>

            {/* TV mockup */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <div style={{
                width: 280, height: 170,
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                borderRadius: 14, border: `3px solid ${C.gray700}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                position: "relative",
              }}>
                {/* TV screen glow */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: "radial-gradient(circle at 50% 40%, rgba(37,99,235,0.15) 0%, transparent 70%)" }} />
                {/* TV icon */}
                <div style={{ width: 44, height: 44, background: C.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                {/* Code display */}
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                    {displayCode}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>Código de ativação</div>
                </div>
              </div>
            </div>

            {/* TV Connected badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.greenLt, border: `1px solid ${C.greenBd}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 500, color: C.green }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                TV Conectada
              </span>
            </div>

            {/* 4 benefits grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BENEFITS.map(b => (
                <div key={b.label} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.gray50, borderRadius: 10, border: `1px solid ${C.gray100}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: C.white, border: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.gray900, marginBottom: 2 }}>{b.label}</div>
                    <div style={{ fontSize: 11, color: C.gray500, lineHeight: 1.4 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN — Activation Panel ══ */}
        <div style={{ position: "sticky", top: "4.5rem" }}>
          <div style={{
            background: C.white, border: `1px solid ${C.gray200}`,
            borderRadius: 20, padding: "1.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.gray900, margin: "0 0 4px" }}>
              Ativação da Tela
            </h2>
            <p style={{ fontSize: 12, color: C.gray500, margin: "0 0 1.25rem" }}>
              Siga os passos abaixo para ativar
            </p>

            {/* ID da Tela */}
            <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.gray500, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>ID da Tela</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.gray900, fontFamily: "monospace" }}>{displayId}</span>
                <button onClick={() => copy(displayId, "id")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  {copied === "id" ? <Check size={14} color={C.green} /> : <CopyIcon />}
                </button>
              </div>
            </div>

            {/* Código de Ativação */}
            <div style={{ background: C.blueLt, border: `1px solid ${C.blueBd}`, borderRadius: 10, padding: "10px 14px", marginBottom: "1rem" }}>
              <div style={{ fontSize: 10, color: C.blue, fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Código de Ativação</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.blue, fontFamily: "monospace" }}>{displayCode}</span>
                <button onClick={() => copy(displayCode, "code")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  {copied === "code" ? <Check size={14} color={C.blue} /> : <RefreshIcon />}
                </button>
              </div>
            </div>

            {/* Wifi status */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1.25rem" }}>
              <WifiIcon color={status === "ready" || status === "found" ? C.blue : C.gray400} />
              <span style={{ fontSize: 12, color: status === "ready" || status === "found" ? C.blue : C.gray400, fontWeight: 500 }}>
                {status === "checking" ? "Verificando conexão..." : status === "ready" ? "Conectado" : status === "pending" ? "Aguardando conexão..." : "Aguardando conexão..."}
              </span>
            </div>

            {/* Steps list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "1.5rem" }}>
              {STEPS.map((step, i) => {
                const done   = activeStep > i
                const active = activeStep === i
                return (
                  <div key={step.id}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                      <StepIcon index={i} />
                      <div style={{ paddingTop: 2 }}>
                        <div style={{
                          fontSize: 13, fontWeight: active ? 600 : done ? 500 : 400,
                          color: done ? C.green : active ? C.blue : C.gray500,
                        }}>
                          {i + 1}. {step.label}
                        </div>
                        {active && (
                          <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{step.desc}</div>
                        )}
                      </div>
                    </div>
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div style={{ marginLeft: 10, width: 1.5, height: 10, background: activeStep > i ? C.greenBd : C.gray200 }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* CTA button */}
            {status === "ready" ? (
              <a href={playerUrl} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", background: C.blue, color: "#fff",
                borderRadius: 10, padding: "13px",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxSizing: "border-box",
              }}>
                Abrir Player na TV →
              </a>
            ) : (
              <button
                disabled
                style={{
                  width: "100%", background: C.blue, color: "#fff",
                  borderRadius: 10, padding: "13px",
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  opacity: status === "invalid" ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {status === "checking" || status === "found" ? (
                  <><Spinner size={14} color="#fff" /> Ativando tela...</>
                ) : status === "invalid" ? (
                  "Código inválido"
                ) : (
                  "Confirmar Código"
                )}
              </button>
            )}

            <a
              href={apkDownloadUrl}
              download
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginTop: 10,
                background: C.gray900,
                color: C.white,
                borderRadius: 10,
                padding: "12px",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Baixar APK Android nativo
            </a>

            {/* Client name if known */}
            {clientName && (
              <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: C.green, fontWeight: 500 }}>
                ✓ {clientName} · Conta verificada
              </div>
            )}
          </div>

          {/* Trust line */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
            {["ICP-Brasil", "Blockchain", "LGPD", "Trust Score auditável"].map(tag => (
              <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: C.white, border: `1px solid ${C.gray200}`, color: C.gray500 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${C.gray200}`, padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.gray400 }}>
        <span>© 2026 DOOHPLAY — Trust Infrastructure for DOOH Advertising</span>
        <span>ICP-Brasil · Blockchain · Enterprise</span>
      </div>
    </main>
  )
}
