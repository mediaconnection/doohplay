// app/tv-3-0-ready/page.tsx
// Fase 45 (16/08/2026) — página pública "TV 3.0 Ready". Ver
// docs/dtv-ready-mvp-plano.md. Texto revisado pra nunca prometer recepção
// de transmissão de TV 3.0 aberta hoje — é compatibilidade de player +
// declaração do instalador sobre um receptor/conversor externo, ver
// app/player/dtv/detectReceiver.ts pro porquê técnico.
import Link from "next/link"

const BG     = "#080C18"
const SURF   = "#0F1629"
const BORDER = "rgba(255,255,255,0.07)"
const TEXT   = "#F1F5F9"
const TEXT2  = "#94A3B8"
const MUTED  = "#475569"
const BLUE   = "#3B82F6"
const PURPLE = "#8B5CF6"

const FAQ = [
  {
    q: "Minha TV já recebe canais de TV 3.0 pelo ar com isso?",
    a: "Não. \"TV 3.0 Ready\" significa que o player DOOHPLAY já é compatível com o novo padrão, com suporte ao codec VVC em preparação — a recepção de transmissão aberta de TV 3.0 depende de emissoras transmitindo comercialmente na sua região e de um receptor/conversor externo conectado à tela. A Globo já transmitiu a Copa do Mundo 2026 em TV 3.0, hoje limitada a Rio de Janeiro, São Paulo e Brasília; SBT e Record seguem com estações-piloto em teste.",
  },
  {
    q: "O que exatamente o selo confirma?",
    a: "Duas coisas, nenhuma delas é decodificar o sinal de TV 3.0: que o instalador confirmou, no cadastro da tela, que existe um receptor ou conversor DTV+ externo conectado a ela, e que o player já suporta mostrar esse selo e, quando o suporte a VVC estiver ativo, priorizar essa variante nos próprios conteúdos exibidos. Quem decodifica a transmissão de TV 3.0 é o conversor externo — hardware de terceiro, não o DOOHPLAY. Não é uma leitura automática de hardware — hoje não existe forma de um player web/WebView detectar sozinho o que está plugado na cadeia HDMI da TV.",
  },
  {
    q: "Preciso comprar algum equipamento?",
    a: "Se você quiser receber transmissão de TV 3.0 de verdade onde ela já existir comercialmente, sim — um conversor externo compatível. O DOOHPLAY em si não vende nem exige esse equipamento; o selo só sinaliza compatibilidade do player.",
  },
  {
    q: "Isso muda o preço da minha assinatura?",
    a: "Não há cobrança adicional confirmada nesta fase. O preço específico da Fase Ready ainda não foi definido — se isso mudar, avisamos antes de qualquer cobrança.",
  },
  {
    q: "Quando a recepção de transmissão aberta vai funcionar de verdade?",
    a: "Já começou de forma limitada: a Globo transmitiu a Copa do Mundo 2026 em TV 3.0, restrita a Rio de Janeiro, São Paulo e Brasília e a quem tem receptor compatível. Expansão pra mais praças e emissoras (SBT, Record) depende de fatores fora do nosso controle. Acompanhamos isso ativamente e atualizamos essa página conforme evolui.",
  },
]

export default function Tv3ReadyPage() {
  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>DOOH<span style={{ color: BLUE }}>PLAY</span></span>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/planos" style={{ fontSize: 12, color: TEXT2, textDecoration: "none", padding: "6px 12px", border: `1px solid ${BORDER}`, borderRadius: 8 }}>Planos</Link>
          <Link href="/onboarding" style={{ fontSize: 12, color: "#fff", textDecoration: "none", padding: "6px 14px", background: BLUE, borderRadius: 8, fontWeight: 600 }}>Instalar Tela</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: PURPLE, fontWeight: 500, marginBottom: 16 }}>
            📡 TV 3.0 Ready
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Preparado para o novo padrão<br /><span style={{ color: PURPLE }}>de TV brasileira.</span>
          </h1>
          <p style={{ fontSize: 15, color: TEXT2, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
            Nosso player já é compatível com o TV 3.0 (DTV+), com suporte ao codec
            VVC em preparação. Isso é preparação técnica de player — não é promessa
            de recepção de transmissão aberta hoje. Veja abaixo exatamente o que já
            existe e o que ainda depende do setor de radiodifusão.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "3rem" }}>
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              ✅ Já existe hoje
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Player compatível com o padrão TV 3.0, com suporte a VVC em preparação",
                "Selo declarativo pro dono confirmar receptor/conversor externo",
                "Visibilidade pro anunciante de quais telas já estão preparadas",
              ].map(item => (
                <li key={item} style={{ fontSize: 13, color: TEXT, display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ color: BLUE, flexShrink: 0 }}>—</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              🔜 Depende do setor
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Transmissão comercial em mais praças e emissoras (hoje: Globo transmitiu a Copa 2026 em RJ/SP/Brasília; SBT e Record seguem em piloto)",
                "Disponibilidade de receptores/conversores em maior escala",
                "Datacasting e parceria de espectro para distribuição própria",
              ].map(item => (
                <li key={item} style={{ fontSize: 13, color: TEXT2, display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ color: MUTED, flexShrink: 0 }}>—</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Perguntas frequentes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ.map(item => (
              <div key={item.q} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <Link href="/onboarding" style={{ display: "inline-block", background: BLUE, color: "#fff", textDecoration: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            Instalar minha tela
          </Link>
        </div>
      </div>
    </main>
  )
}
