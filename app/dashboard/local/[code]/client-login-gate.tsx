"use client"
// app/dashboard/local/[code]/client-login-gate.tsx
// Fase 14 — tela de login do cliente. Mostrada pelo page.tsx (Server
// Component) sempre que não há sessão válida pro código da URL — nesse
// caso o page.tsx nem chega a buscar cpf_cnpj/email/telefone, então não
// tem nada sensível pra esconder aqui, só o fluxo de pedir/confirmar OTP.
import { useState } from "react"

const C = {
  bg: "#F8FAFC", white: "#FFFFFF", border: "#E5E7EB",
  blue: "#3B82F6", blueLt: "#EFF6FF",
  red: "#DC2626", redLt: "#FEF2F2",
  text: "#111827", text2: "#6B7280", text3: "#9CA3AF",
}

export default function ClientLoginGate({ code, clientName }: { code: string; clientName: string }) {
  const [step, setStep] = useState<"request" | "verify">("request")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sentMessage, setSentMessage] = useState("")

  const requestCode = async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/client/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao pedir código. Tenta de novo.")
        setLoading(false)
        return
      }
      setSentMessage(data.message || "Se o código existir e tiver WhatsApp cadastrado, enviamos um código de acesso.")
      setStep("verify")
    } catch {
      setError("Erro de conexão. Tenta de novo.")
    }
    setLoading(false)
  }

  const verifyCode = async () => {
    if (!otp.trim()) { setError("Digita o código que chegou no WhatsApp"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/client/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Código incorreto")
        setLoading(false)
        return
      }
      // Sessão criada com sucesso — recarrega pra o Server Component ver
      // o cookie novo e renderizar o dashboard de verdade.
      window.location.reload()
    } catch {
      setError("Erro de conexão. Tenta de novo.")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 380, width: "100%" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          <span style={{ color: C.blue }}>DOOH</span>PLAY
        </div>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 24 }}>
          {clientName ? `Entrar como ${clientName}` : "Entrar"}
        </div>

        {error && (
          <div style={{ background: C.redLt, color: C.red, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === "request" ? (
          <>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 1.5 }}>
              Pra acessar o painel, vamos mandar um código de 6 dígitos pro WhatsApp cadastrado deste cliente.
            </div>
            <button
              onClick={requestCode}
              disabled={loading}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: C.blue, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Enviando…" : "Enviar código pro WhatsApp"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 16, lineHeight: 1.5 }}>
              {sentMessage}
            </div>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 20, letterSpacing: 6, textAlign: "center", marginBottom: 16, boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && verifyCode()}
            />
            <button
              onClick={verifyCode}
              disabled={loading}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, background: C.blue, color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginBottom: 10 }}
            >
              {loading ? "Confirmando…" : "Entrar"}
            </button>
            <button
              onClick={() => { setStep("request"); setOtp(""); setError("") }}
              style={{ width: "100%", padding: "8px 16px", borderRadius: 8, background: "transparent", color: C.text3, border: "none", fontSize: 12, cursor: "pointer" }}
            >
              Pedir outro código
            </button>
          </>
        )}
      </div>
    </div>
  )
}
