export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Link from "next/link"
import { getPool } from "@/lib/db"
import CpfForm from "./cpf-form"

// ─── Types ────────────────────────────────────────────────────────────────────
type Client = { id: string; code: string; name: string; phone: string | null; active: boolean }
type Subscription = { asaas_subscription_id: string; plan: string; value: number; status: string; created_at: string } | null
type Payment = { id: string; asaas_payment_id: string; value: number; status: string; paid_at: string | null; created_at: string }
type AsaasPayment = { id: string; value: number; status: string; dueDate: string; paymentDate?: string; invoiceUrl?: string; billingType: string; description?: string }

// ─── Colors ───────────────────────────────────────────────────────────────────
// Azul/verde alinhados a paleta de marca usada no resto do site (landing,
// planos, trust-center, /install, dashboard-client) - mesmo ajuste ja feito
// nos outros arquivos.
const C = {
  bg: "#F8FAFC", white: "#FFFFFF", border: "#E5E7EB", border2: "#F3F4F6",
  blue: "#3B82F6", blueLt: "#EFF6FF", blueBd: "#BFDBFE",
  green: "#10B981", greenLt: "#DCFCE7", greenBd: "#86EFAC",
  amber: "#D97706", amberLt: "#FFFBEB", amberBd: "#FDE68A",
  red: "#DC2626", redLt: "#FEF2F2", redBd: "#FECACA",
  gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB",
  gray400: "#9CA3AF", gray500: "#6B7280", gray700: "#374151", gray900: "#111827",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtR(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d?: string | null) {
  if (!d) return "—"
  try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(d)) } catch { return "—" }
}
function statusLabel(s: string) {
  const m: Record<string, { label: string; color: string; bg: string; border: string }> = {
    RECEIVED:  { label: "Recebido",  color: C.green, bg: C.greenLt, border: C.greenBd },
    CONFIRMED: { label: "Confirmado",color: C.green, bg: C.greenLt, border: C.greenBd },
    PENDING:   { label: "Pendente",  color: C.amber, bg: C.amberLt, border: C.amberBd },
    OVERDUE:   { label: "Vencido",   color: C.red,   bg: C.redLt,   border: C.redBd   },
    REFUNDED:  { label: "Estornado", color: C.gray500,bg: C.gray100,border: C.gray200 },
    ACTIVE:    { label: "Ativo",     color: C.green, bg: C.greenLt, border: C.greenBd },
    INACTIVE:  { label: "Inativo",   color: C.gray500,bg: C.gray100,border: C.gray200 },
    paid:      { label: "Pago",      color: C.green, bg: C.greenLt, border: C.greenBd },
    pending:   { label: "Pendente",  color: C.amber, bg: C.amberLt, border: C.amberBd },
  }
  return m[s] ?? { label: s, color: C.gray500, bg: C.gray100, border: C.gray200 }
}

function billingIcon(type: string) {
  if (type === "PIX")     return "⚡"
  if (type === "BOLETO")  return "📄"
  if (type === "CREDIT_CARD") return "💳"
  return "💵"
}

// ─── Data fetching ────────────────────────────────────────────────────────────
async function fetchClient(code: string): Promise<Client | null> {
  const pool = getPool()
  try {
    const r = await Promise.race([
      pool.query(`SELECT id::text, code, name, phone, active FROM studio_clients WHERE code = $1 LIMIT 1`, [code]),
      new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000)),
    ]) as any
    return r.rows?.[0] ?? null
  } catch { return null }
}

async function fetchSubscription(code: string): Promise<Subscription> {
  const pool = getPool()
  try {
    const r = await Promise.race([
      pool.query(`SELECT asaas_subscription_id, plan, value, status, created_at::text FROM financial_subscriptions WHERE code = $1 LIMIT 1`, [code]),
      new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000)),
    ]) as any
    return r.rows?.[0] ?? null
  } catch { return null }
}

async function fetchPayments(code: string): Promise<Payment[]> {
  const pool = getPool()
  try {
    const r = await Promise.race([
      pool.query(
        `SELECT id::text, asaas_payment_id, value, status, paid_at::text, created_at::text
         FROM financial_payments WHERE code = $1 ORDER BY created_at DESC LIMIT 12`,
        [code]
      ),
      new Promise<never>((_, j) => setTimeout(() => j(new Error("t")), 4000)),
    ]) as any
    return r.rows ?? []
  } catch { return [] }
}

async function fetchAsaasPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  try {
    const key = process.env.ASAAS_API_KEY
    if (!key) return []
    const res = await fetch(
      `https://api.asaas.com/v3/payments?subscription=${subscriptionId}&limit=12`,
      { headers: { "access_token": key, "Content-Type": "application/json" }, next: { revalidate: 60 } }
    )
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FinanceiroDashboard({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const client = await fetchClient(code)
  if (!client) notFound()

  const [subscription, localPayments] = await Promise.all([
    fetchSubscription(code),
    fetchPayments(code),
  ])

  // Try Asaas live data if subscription exists
  let asaasPayments: AsaasPayment[] = []
  if (subscription?.asaas_subscription_id) {
    asaasPayments = await fetchAsaasPayments(subscription.asaas_subscription_id)
  }

  // Use Asaas data if available, otherwise fall back to local DB
  const payments = asaasPayments.length > 0 ? asaasPayments.map(p => ({
    id: p.id,
    asaas_payment_id: p.id,
    value: p.value,
    status: p.status,
    paid_at: p.paymentDate ?? null,
    created_at: p.dueDate,
    invoiceUrl: p.invoiceUrl,
    billingType: p.billingType,
    dueDate: p.dueDate,
  })) : localPayments.map(p => ({
    ...p,
    invoiceUrl: undefined,
    billingType: "PIX",
    dueDate: p.created_at,
  }))

  const totalPaid = payments.filter(p => p.status === "RECEIVED" || p.status === "CONFIRMED" || p.status === "paid").reduce((a, p) => a + p.value, 0)
  const pending = payments.filter(p => p.status === "PENDING" || p.status === "pending")
  const overdue = payments.filter(p => p.status === "OVERDUE")
  const nextPayment = pending[0]
  const planNames: Record<string, string> = { starter: "Local", pro: "Business", multi: "Enterprise" }

  return (
    <main style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.gray900 }}>

      {/* ── NAV ── */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, background: C.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.gray900 }}>DOOHPLAY</span>
          </Link>
          <span style={{ color: C.gray400 }}>/</span>
          <span style={{ fontSize: 13, color: C.gray500 }}>Dashboard Financeiro</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: C.blueLt, padding: "2px 8px", borderRadius: 6 }}>{client.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/local/${code}`} style={{ fontSize: 12, color: C.gray500, background: C.gray100, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", textDecoration: "none" }}>
            ← Dashboard
          </Link>
          <Link href={`/portal/${code}`} style={{ fontSize: 12, color: C.blue, background: C.blueLt, border: `1px solid ${C.blueBd}`, borderRadius: 8, padding: "6px 12px", textDecoration: "none" }}>
            Portal público
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* ── SUBSCRIPTION STATUS ── */}
        <div style={{ background: subscription ? C.blueLt : C.amberLt, border: `1px solid ${subscription ? C.blueBd : C.amberBd}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: subscription ? C.blue : C.amber, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {subscription ? "✓" : "⚡"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>
                {subscription ? `Plano ${planNames[subscription.plan] ?? subscription.plan} — Ativo` : "Sem assinatura ativa"}
              </div>
              <div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>
                {subscription ? `${fmtR(subscription.value)}/mês · Próximo vencimento: ${nextPayment ? fmtDate(nextPayment.dueDate) : "—"}` : "Ative um plano para começar a monetizar sua TV"}
              </div>
            </div>
          </div>
          {!subscription && (
            <Link href="/planos" style={{ background: C.amber, color: C.white, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Ver planos →
            </Link>
          )}
          {subscription && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, ...statusLabel(subscription.status) }}>
              {statusLabel(subscription.status).label}
            </span>
          )}
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total pago",       value: fmtR(totalPaid),          icon: "✅", color: C.green,  bg: C.greenLt, bd: C.greenBd },
            { label: "Pendente",         value: fmtR(pending.reduce((a,p)=>a+p.value,0)), icon: "⏳", color: C.amber, bg: C.amberLt, bd: C.amberBd },
            { label: "Em atraso",        value: String(overdue.length),   icon: "⚠️", color: overdue.length > 0 ? C.red : C.green, bg: overdue.length > 0 ? C.redLt : C.greenLt, bd: overdue.length > 0 ? C.redBd : C.greenBd },
            { label: "Próx. pagamento",  value: nextPayment ? fmtDate(nextPayment.dueDate) : "—", icon: "📅", color: C.blue, bg: C.blueLt, bd: C.blueBd },
          ].map(k => (
            <div key={k.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.gray500 }}>{k.label}</span>
                <span style={{ fontSize: 16 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* ── PRÓXIMO PAGAMENTO ── */}
        {nextPayment && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Próximo pagamento</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{fmtR(nextPayment.value)}</div>
              <div style={{ fontSize: 12, color: C.gray500, marginTop: 4 }}>Vencimento: {fmtDate(nextPayment.dueDate)} · {billingIcon(nextPayment.billingType)} {nextPayment.billingType}</div>
            </div>
            {(nextPayment as any).invoiceUrl && (
              <a href={(nextPayment as any).invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ background: C.blue, color: C.white, borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                Pagar agora →
              </a>
            )}
          </div>
        )}

        {/* ── HISTÓRICO DE PAGAMENTOS ── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border2}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Histórico de pagamentos</div>
              <div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{payments.length} transações · {asaasPayments.length > 0 ? "dados ao vivo do Asaas" : "dados locais"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {asaasPayments.length > 0 && (
                <span style={{ fontSize: 11, color: C.green, background: C.greenLt, border: `1px solid ${C.greenBd}`, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
                  ● Asaas ao vivo
                </span>
              )}
            </div>
          </div>

          {payments.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: C.gray400 }}>
              Nenhum pagamento registrado ainda
            </div>
          ) : payments.map((p, i) => {
            const st = statusLabel(p.status)
            const isPaid = p.status === "RECEIVED" || p.status === "CONFIRMED" || p.status === "paid"
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "14px 1.5rem", borderBottom: i < payments.length - 1 ? `1px solid ${C.border2}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: isPaid ? C.greenLt : st.bg, border: `1px solid ${isPaid ? C.greenBd : st.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, fontSize: 16, flexShrink: 0 }}>
                  {isPaid ? "✓" : billingIcon((p as any).billingType ?? "PIX")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.gray900 }}>
                    {fmtR(p.value)}
                    {(p as any).billingType && <span style={{ fontSize: 11, color: C.gray400, marginLeft: 8 }}>{(p as any).billingType}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>
                    Venc: {fmtDate((p as any).dueDate ?? p.created_at)}
                    {isPaid && p.paid_at && ` · Pago: ${fmtDate(p.paid_at)}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                  {(p as any).invoiceUrl && !isPaid && (
                    <a href={(p as any).invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: "none", fontWeight: 500 }}>
                      Pagar →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── DADOS DA ASSINATURA ── */}
        {subscription && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Detalhes da assinatura</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Plano",       value: planNames[subscription.plan] ?? subscription.plan },
                { label: "Valor mensal",value: fmtR(subscription.value) },
                { label: "Desde",       value: fmtDate(subscription.created_at) },
              ].map(s => (
                <div key={s.label} style={{ background: C.gray50, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: C.gray500, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.gray900 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CPF / CNPJ ── */}
        <div style={{ marginBottom: 20 }}>
          <CpfForm code={code} />
        </div>

        {/* ── ATIVAR PLANO ── */}
        {!subscription && (
          <div style={{ background: C.blueLt, border: `1px solid ${C.blueBd}`, borderRadius: 14, padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Comece a monetizar sua TV</div>
            <div style={{ fontSize: 13, color: C.gray500, marginBottom: 20 }}>Receba pagamentos mensais por exibir anúncios. Grátis para começar.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Link href="/planos" style={{ background: C.blue, color: C.white, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                Ver planos →
              </Link>
              <a href={`https://wa.me/5511962050987?text=Quero+ativar+minha+tela+${code}`} style={{ background: C.white, color: C.blue, border: `1px solid ${C.blueBd}`, borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Falar com suporte
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
