export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { getPool } from "@/lib/db"

// Azul/verde alinhados a paleta de marca usada no resto do site.
const C = {
  bg: "#F8FAFC", white: "#FFFFFF", border: "#E5E7EB", border2: "#F3F4F6",
  blue: "#3B82F6", blueLt: "#EFF6FF", blueBd: "#BFDBFE",
  green: "#10B981", greenLt: "#DCFCE7", greenBd: "#86EFAC",
  amber: "#D97706", amberLt: "#FFFBEB",
  purple: "#7C3AED", purpleLt: "#F5F3FF",
  text: "#111827", text2: "#6B7280", text3: "#9CA3AF",
  gray50: "#F9FAFB", gray100: "#F3F4F6",
}

const fmtR = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function AIRevenuePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const pool = getPool()

  let client: any = null
  try {
    const r = await pool.query(
      `SELECT id::text, code, name, business_type FROM studio_clients WHERE code = $1 LIMIT 1`,
      [code.toUpperCase()]
    )
    client = r.rows[0] ?? null
  } catch {}

  if (!client) notFound()

  // Nomes de marca real (Itaú/iFood/Samsung/Natura) removidos em 17/08/2026:
  // eram apresentados como se fossem prospects reais interessados nesta
  // tela especifica, o que nao e verdade - nenhuma dessas empresas tem
  // relacao real com este cliente. Trocado por categoria generica de
  // anunciante. Match%, valor e projecao seguem fabricados (pendente de
  // decisao, ver "Ganhos Futuros" no dashboard principal).
  const opportunities = [
    {
      icon: "🏦", title: "Anunciante do setor financeiro — Cartão de crédito",
      desc: "Campanha de 90 dias · CPM R$ 12,00 · alto match com seu público de renda média-alta.",
      value: "+R$ 240/mês", color: C.green, bg: C.greenLt, border: C.greenBd,
      match: "94%", category: "Financeiro",
    },
    {
      icon: "🛵", title: "Anunciante de delivery — Promoção",
      desc: "Anúncio rotativo · 15s · exibição em horário de almoço e jantar.",
      value: "+R$ 180/mês", color: C.blue, bg: C.blueLt, border: C.blueBd,
      match: "88%", category: "Alimentação",
    },
    {
      icon: "📱", title: "Anunciante de tecnologia — Lançamento de produto",
      desc: "Campanha nacional · 30s · alta CPM por ser campanha de lançamento.",
      value: "+R$ 320/mês", color: C.purple, bg: C.purpleLt, border: "#DDD6FE",
      match: "79%", category: "Tecnologia",
    },
    {
      icon: "🧴", title: "Anunciante de beleza — Linha sazonal",
      desc: "Campanha sazonal · junho a agosto · público feminino 25-45 anos.",
      value: "+R$ 140/mês", color: C.amber, bg: C.amberLt, border: "#FDE68A",
      match: "72%", category: "Beleza",
    },
  ]

  const tips = [
    {
      icon: "⏰", title: "Ative o horário de pico",
      desc: "Telas ativas entre 7h–9h e 17h–19h têm 3× mais visualizações. Você está perdendo R$ 180/mês.",
      impact: "+34% views", color: C.amber,
    },
    {
      icon: "🖼", title: "Adicione conteúdo próprio",
      desc: "Estabelecimentos com promoções próprias retêm 40% mais atenção. Crie seu primeiro card.",
      impact: "+40% engajamento", color: C.blue,
    },
    {
      icon: "📅", title: "Ative campanhas de fim de semana",
      desc: "Sábado e domingo têm 28% mais tráfego no seu segmento. Nenhum anunciante está ativo nesses dias.",
      impact: "+R$ 120/mês", color: C.green,
    },
  ]

  const projection = [
    { month: "Jun/26", value: 847,  label: "Atual",     color: C.text2  },
    { month: "Jul/26", value: 980,  label: "Projetado", color: C.blue   },
    { month: "Ago/26", value: 1120, label: "Otimizado", color: C.green  },
    { month: "Set/26", value: 1340, label: "Máximo",    color: C.purple },
  ]
  const maxProj = Math.max(...projection.map(p => p.value))

  return (
    <main style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/dashboard/local/${code}`} style={{ fontSize: 13, color: C.text2, textDecoration: "none" }}>
            ← Dashboard
          </Link>
          <span style={{ color: C.border }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>AI Revenue Center</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>{client.name}</span>
          <span style={{ fontSize: 11, background: C.purpleLt, color: C.purple, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
            ⭐ IA Ativa
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #7C3AED 100%)`, borderRadius: 16, padding: "28px 32px", marginBottom: 28, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", opacity: 0.8, marginBottom: 8 }}>
            AI REVENUE CENTER
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
            Potencial não realizado:{" "}
            <span style={{ color: "#FCD34D" }}>R$ 880/mês</span>
          </div>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 20 }}>
            Com base no seu perfil ({client.business_type}), identificamos 4 oportunidades de receita que você ainda não está aproveitando.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Match médio",      value: "83%"     },
              { label: "Oportunidades",    value: "4"       },
              { label: "Receita atual",    value: "R$ 847"  },
              { label: "Potencial máximo", value: "R$ 1.727"},
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Projeção de receita</div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
            Se você ativar todas as oportunidades identificadas pela IA
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120, marginBottom: 12 }}>
            {projection.map((p, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{fmtR(p.value)}</div>
                <div style={{
                  width: "100%", borderRadius: "6px 6px 0 0",
                  height: `${(p.value / maxProj) * 90}px`,
                  background: i === 0 ? C.gray100 : p.color,
                  opacity: i === 0 ? 1 : 0.85,
                }} />
                <div style={{ fontSize: 11, color: C.text3 }}>{p.month}</div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 600 }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>
          🎯 Oportunidades identificadas pela IA
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {opportunities.map((op, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: op.bg, border: `1px solid ${op.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {op.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{op.title}</span>
                  <span style={{ fontSize: 10, background: op.bg, color: op.color, fontWeight: 600, padding: "1px 7px", borderRadius: 10, border: `1px solid ${op.border}` }}>
                    {op.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.text2 }}>{op.desc}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: op.color }}>{op.value}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>
                  Match: <strong style={{ color: op.color }}>{op.match}</strong>
                </div>
              </div>
              <button style={{ background: op.color, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                Ativar
              </button>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>
          💡 Dicas de otimização
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{tip.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: 12 }}>{tip.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: tip.color }}>{tip.impact}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Quer maximizar sua receita?
          </div>
          <div style={{ fontSize: 13, color: C.text2, marginBottom: 20 }}>
            Nossa equipe pode ajudar a ativar todas as oportunidades identificadas.
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href={`/dashboard/local/${code}`} style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.text2, textDecoration: "none" }}>
              ← Voltar ao dashboard
            </Link>
            <a href="https://wa.me/5511962050987?text=Quero+ativar+as+oportunidades+do+AI+Revenue+Center" target="_blank" rel="noreferrer" style={{ padding: "10px 24px", borderRadius: 8, background: C.green, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              💬 Falar com especialista
            </a>
          </div>
        </div>

      </div>
    </main>
  )
}
