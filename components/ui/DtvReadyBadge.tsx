// components/ui/DtvReadyBadge.tsx
// Fase 45 (16/08/2026) — selo comercial "TV 3.0 Ready", compartilhado
// entre o dashboard do cliente e o portal do anunciante. Ver
// docs/dtv-ready-mvp-plano.md e docs/api-contract.md (campo dtv_ready).
//
// Importante: este selo reflete uma flag DECLARADA no admin (o instalador
// confirma que existe um receptor/conversor DTV+ conectado àquela tela),
// não uma detecção automática de hardware nem uma promessa de recepção de
// transmissão de TV 3.0 aberta hoje. Ver app/player/dtv/detectReceiver.ts
// para o porquê técnico.
"use client"

type DtvReadyBadgeProps = {
  enabled: boolean
  /** "full": selo com texto e ícone. "compact": só o ícone, pra espaços apertados. */
  variant?: "full" | "compact"
}

export default function DtvReadyBadge({ enabled, variant = "full" }: DtvReadyBadgeProps) {
  if (!enabled) return null

  const iconSvg = (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 18v3" />
      <path d="M7 9l2 2 4-4" />
    </svg>
  )

  if (variant === "compact") {
    return (
      <span
        title="TV 3.0 Ready"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 22, height: 22, borderRadius: 6,
          background: "linear-gradient(135deg, #7c3aed, #3B82F6)", color: "#fff",
        }}
      >
        {iconSvg}
      </span>
    )
  }

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 999,
        background: "linear-gradient(135deg, #7c3aed, #3B82F6)", color: "#fff",
        fontSize: 11, fontWeight: 700, letterSpacing: ".02em",
      }}
    >
      {iconSvg}
      TV 3.0 READY
    </span>
  )
}
