// app/admin/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function formatPhone(phone: string): string {
  const d = (phone ?? "").replace(/\D/g, "")
  // 55DDXXXXXXXXX (com 55) ou DDXXXXXXXXX (sem) — aceita os dois formatos
  // que já vimos gravados em studio_clients ao longo do projeto.
  const local = d.startsWith("55") && d.length > 11 ? d.slice(2) : d
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return phone
}

function formatCpfCnpj(doc: string): string {
  const d = (doc ?? "").replace(/\D/g, "")
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  return doc
}

const BG      = "#0B1020"
const SURFACE = "#111827"
const BORDER  = "#1F2937"
const TEXT     = "#F9FAFB"
const TEXT2    = "#9CA3AF"
const MUTED    = "#4B5563"
const BLUE     = "#3B82F6"
const GREEN    = "#10B981"
const AMBER    = "#F59E0B"
const RED      = "#EF4444"
const PURPLE   = "#8B5CF6"

const fmt = (d?: string | null) => {
  if (!d) return "—"
  try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(d)) }
  catch { return "—" }
}
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0)

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: color + "22", color, border: "1px solid " + color + "44" }}>
      {label}
    </span>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: "20px 24px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? TEXT }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Preview de mídia ──────────────────────────────────────────────────────────
function MediaPreview({ url, type, name }: { url: string; type: string; name: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!url) return (
    <div style={{ width: 80, height: 60, background: BORDER, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
      {type === "video" ? "🎬" : "🖼️"}
    </div>
  )
  if (type === "video") {
    return (
      <div style={{ flexShrink: 0 }}>
        {expanded ? (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpanded(false)}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: "90%" }}>
              <video src={url} controls autoPlay style={{ width: "100%", borderRadius: 12, maxHeight: "80vh" }} />
              <button onClick={() => setExpanded(false)} style={{ marginTop: 12, background: SURFACE, color: TEXT2, border: "1px solid " + BORDER, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>Fechar</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setExpanded(true)} style={{ width: 100, height: 70, background: BORDER, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 4, border: "1px solid " + MUTED }}>
            <span style={{ fontSize: 24 }}>🎬</span>
            <span style={{ fontSize: 9, color: TEXT2 }}>▶ Ver vídeo</span>
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0 }}>
      {expanded ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpanded(false)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: "90%" }}>
            <img src={url} alt={name} style={{ width: "100%", borderRadius: 12, maxHeight: "85vh", objectFit: "contain" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => setExpanded(false)} style={{ background: SURFACE, color: TEXT2, border: "1px solid " + BORDER, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>Fechar</button>
              <a href={url} target="_blank" rel="noreferrer" style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, textDecoration: "none" }}>Abrir original ↗</a>
            </div>
          </div>
        </div>
      ) : (
        <img src={url} alt={name} onClick={() => setExpanded(true)}
          style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "1px solid " + MUTED, display: "block" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
        />
      )}
    </div>
  )
}

// ── Modal CSV Import ──────────────────────────────────────────────────────────
function ModalCsvImport({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep]         = useState<"upload" | "preview" | "result">("upload")
  const [preview, setPreview]   = useState<any[]>([])
  const [results, setResults]   = useState<any[]>([])
  const [summary, setSummary]   = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const CSV_TEMPLATE = "name,business_type,address,city,phone,email\nBarbearia Silva,Barbearia,Rua X 123,São Paulo,11999998888,silva@email.com\nPadaria Central,Padaria,Av Y 456,Campinas,19988887777,padaria@email.com"

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href = url; a.download = "clientes-template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) { setError("Selecione um arquivo .csv"); return }
    setLoading(true); setError("")
    try {
      const text = await file.text()
      const res  = await fetch("/api/admin/clients/import?" + new URLSearchParams({ data: encodeURIComponent(text) }))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao processar CSV")
      setPreview(data.preview)
      setStep("preview")
    } catch (err: any) {
      setError(err.message || "Erro ao processar arquivo")
    }
    setLoading(false)
  }

  const handleImport = async () => {
    setLoading(true); setError("")
    try {
      const res  = await fetch("/api/admin/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro na importação")
      setResults(data.results)
      setSummary(data.summary)
      setStep("result")
      if (data.summary.ok > 0) onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro na importação")
    }
    setLoading(false)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 16, width: "100%", maxWidth: step === "preview" ? 800 : 520, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid " + BORDER, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>
              {step === "upload"  && "Importar Clientes via CSV"}
              {step === "preview" && `Preview — ${preview.length} linhas encontradas`}
              {step === "result"  && "Importação concluída"}
            </div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>
              {step === "upload"  && "Cadastre múltiplos clientes de uma vez"}
              {step === "preview" && `${preview.filter(r => r.valid).length} válidas · ${preview.filter(r => !r.valid).length} com erro`}
              {step === "result"  && `${summary?.ok} importados · ${summary?.error} erros`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {step === "upload" && (
            <div>
              <div style={{ background: BG, border: "1px solid " + BORDER, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: TEXT2 }}>
                <div style={{ fontWeight: 600, color: TEXT, marginBottom: 6 }}>Colunas esperadas:</div>
                <code style={{ fontSize: 11, color: BLUE }}>name, business_type, address, city, phone, email</code>
                <div style={{ marginTop: 6, color: MUTED }}>Obrigatórios: <strong style={{ color: TEXT }}>name, city, phone</strong> · Isso só cadastra o cliente — pra ativar cobrança, use "Assinatura" depois</div>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? BLUE : BORDER}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? BLUE + "0A" : BG, transition: "all .2s", marginBottom: 16 }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                  {loading ? "Processando…" : "Clique ou arraste o arquivo CSV"}
                </div>
                <div style={{ fontSize: 12, color: TEXT2 }}>Apenas arquivos .csv</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
              <button onClick={downloadTemplate} style={{ width: "100%", background: "transparent", border: "1px solid " + BORDER, borderRadius: 8, padding: "10px", color: TEXT2, fontSize: 13, cursor: "pointer" }}>
                ↓ Baixar template CSV
              </button>
            </div>
          )}

          {step === "preview" && (
            <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + BORDER }}>
                    {["#","Nome","Tipo","Cidade","Telefone","Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < preview.length - 1 ? "1px solid " + BORDER : "none", background: row.valid ? "transparent" : RED + "08" }}>
                      <td style={{ padding: "8px 12px", color: TEXT2 }}>{row.line}</td>
                      <td style={{ padding: "8px 12px", color: TEXT, fontWeight: 500 }}>{row.name || "—"}</td>
                      <td style={{ padding: "8px 12px", color: TEXT2 }}>{row.business_type || "—"}</td>
                      <td style={{ padding: "8px 12px", color: TEXT2 }}>{row.city || "—"}</td>
                      <td style={{ padding: "8px 12px", color: TEXT2 }}>{row.phone || "—"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {row.valid
                          ? <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>✓ OK</span>
                          : <span style={{ color: RED, fontSize: 11 }}>⚠ {row.errors?.join(", ")}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {step === "result" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, background: GREEN + "12", border: "1px solid " + GREEN + "33", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: GREEN }}>{summary?.ok}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>Importados</div>
                </div>
                <div style={{ flex: 1, background: RED + "12", border: "1px solid " + RED + "33", borderRadius: 10, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: RED }}>{summary?.error}</div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 4 }}>Erros</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: BG, borderRadius: 8, border: "1px solid " + BORDER }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{r.name}</span>
                      {r.code && <span style={{ fontSize: 11, color: TEXT2, background: BORDER, padding: "1px 6px", borderRadius: 8, marginLeft: 8 }}>{r.code}</span>}
                    </div>
                    {r.status === "ok"
                      ? <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>✓ Criado</span>
                      : <span style={{ fontSize: 11, color: RED }}>✕ {r.error}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: RED + "18", border: "1px solid " + RED + "44", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 13, color: RED }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid " + BORDER, display: "flex", gap: 10, flexShrink: 0 }}>
          {step === "upload" && (
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("upload")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, fontSize: 13, cursor: "pointer" }}>← Voltar</button>
              <button onClick={handleImport} disabled={loading || preview.filter(r => r.valid).length === 0} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: loading ? MUTED : GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Importando…" : `Importar ${preview.filter(r => r.valid).length} clientes →`}
              </button>
            </>
          )}
          {step === "result" && (
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Modal Novo Cliente (cadastro manual, sem passar pelo link público) ───────
// Reaproveita a mesma rota do CSV (/api/admin/clients/import), só que com uma
// linha só — evita criar uma quarta lógica de cadastro paralela (já temos
// /api/cadastro público, /api/admin/clients/import em lote, e agora isso é só
// o caso de 1 linha da mesma rota). Por design, essa rota NÃO cria assinatura
// no Asaas — só o registro do cliente. Pra cobrança, use o botão "Assinatura"
// depois, separadamente (mesmo padrão que o CSV import já segue).
function ModalNovoCliente({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", business_type: "", address: "", city: "", phone: "", email: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ code?: string; status: string; error?: string } | null>(null)

  const BUSINESS_TYPES = [
    "Academia", "Automotivo", "Bar", "Barbearia", "Casa & Serviços", "Clínica",
    "Condomínio", "Farmácia", "Lanchonete", "Loja de Roupas", "Mercado",
    "Padaria", "Petshop", "Restaurante", "Salão de Beleza", "Outro",
  ]

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError("")
    if (!form.name.trim())  { setError("Nome é obrigatório"); return }
    if (!form.city.trim())  { setError("Cidade é obrigatória"); return }
    if (!form.phone.trim()) { setError("Telefone é obrigatório"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [{ ...form, line: 1, valid: true, errors: [] }] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar")
      const r = data.results?.[0]
      setResult(r)
      if (r?.status === "ok") onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar")
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 8,
    padding: "9px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: TEXT2, marginBottom: 4, display: "block" }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid " + BORDER, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>+ Novo Cliente</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>Cadastro manual, sem passar pelo link público</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {result ? (
            result.status === "ok" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Cliente cadastrado!</div>
                <div style={{ fontSize: 13, color: TEXT2 }}>Código gerado: <span style={{ color: BLUE, fontWeight: 700 }}>{result.code}</span></div>
                <div style={{ fontSize: 12, color: TEXT2, marginTop: 10 }}>
                  Sem assinatura no Asaas ainda — use o botão <strong>"Assinatura"</strong> na lista de clientes pra ativar a cobrança quando quiser.
                </div>
              </div>
            ) : (
              <div style={{ background: RED + "18", border: "1px solid " + RED + "44", borderRadius: 8, padding: "14px", fontSize: 13, color: RED }}>
                ⚠️ {result.error}
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome do estabelecimento *</label>
                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Barbearia do João" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tipo de negócio</label>
                  <select style={inputStyle} value={form.business_type} onChange={e => set("business_type", e.target.value)}>
                    <option value="">Selecione…</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cidade *</label>
                  <input style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} placeholder="São Paulo" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Endereço</label>
                <input style={inputStyle} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rua, número, bairro" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(11) 9 9999-9999" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contato@email.com" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: RED + "18", border: "1px solid " + RED + "44", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 13, color: RED }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid " + BORDER, display: "flex", gap: 10, flexShrink: 0 }}>
          {result ? (
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: loading ? MUTED : GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Cadastrando…" : "Cadastrar cliente →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


// ── Modal Editar Cliente ──────────────────────────────────────────────────────
// Mesma estrutura de campos do ModalNovoCliente, mas pré-preenchido e
// chamando PATCH em vez de criar um registro novo.
function ModalEditarCliente({ client, onClose, onSuccess }: { client: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: client.name ?? "",
    business_type: client.business_type ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
    cpf_cnpj: client.cpf_cnpj ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const BUSINESS_TYPES = [
    "Academia", "Automotivo", "Bar", "Barbearia", "Casa & Serviços", "Clínica",
    "Condomínio", "Farmácia", "Lanchonete", "Loja de Roupas", "Mercado",
    "Padaria", "Petshop", "Restaurante", "Salão de Beleza", "Outro",
  ]

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError("")
    if (!form.name.trim())  { setError("Nome é obrigatório"); return }
    if (!form.city.trim())  { setError("Cidade é obrigatória"); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${client.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      setSuccess(true)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar")
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 8,
    padding: "9px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: TEXT2, marginBottom: 4, display: "block" }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid " + BORDER, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>✏️ Editar Cliente</div>
            <div style={{ fontSize: 12, color: TEXT2, marginTop: 3 }}>{client.name} · #{client.code}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Dados atualizados!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome do estabelecimento *</label>
                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tipo de negócio</label>
                  <select style={inputStyle} value={form.business_type} onChange={e => set("business_type", e.target.value)}>
                    <option value="">Selecione…</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cidade *</label>
                  <input style={inputStyle} value={form.city} onChange={e => set("city", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Endereço</label>
                <input style={inputStyle} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rua, número, bairro" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(11) 9 9999-9999" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>CPF/CNPJ</label>
                <input style={inputStyle} value={form.cpf_cnpj} onChange={e => set("cpf_cnpj", e.target.value)} placeholder="Só números" />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: RED + "18", border: "1px solid " + RED + "44", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 13, color: RED }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid " + BORDER, display: "flex", gap: 10, flexShrink: 0 }}>
          {success ? (
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: loading ? MUTED : BLUE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Salvando…" : "Salvar alterações"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


// ── Modal Assinatura ──────────────────────────────────────────────────────────
function ModalAssinatura({ client, onClose, onSuccess }: { client: any; onClose: () => void; onSuccess: () => void }) {
  const [plan, setPlan]       = useState("starter")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const PLANS_INFO: Record<string, { label: string; value: string; desc: string }> = {
    starter:  { label: "Starter",  value: "R$ 97/mês",  desc: "1 TV · Suporte básico" },
    pro:      { label: "Pro",      value: "R$ 290/mês", desc: "3 TVs · Relatórios · Prioridade" },
    business: { label: "Business", value: "R$ 620/mês", desc: "Até 5 TVs · Suporte dedicado" },
  }

  const handleCreate = async () => {
    setLoading(true); setError("")
    try {
      const res  = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: client.code, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar assinatura")
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 16, padding: 28, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>💳 Criar Assinatura</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: TEXT2, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ background: BG, borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{client.name}</div>
          <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{client.code} · {client.email ?? "sem email"}</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: TEXT2, display: "block", marginBottom: 8 }}>Selecione o plano</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(PLANS_INFO).map(([key, info]) => (
              <div key={key} onClick={() => setPlan(key)}
                style={{ background: plan === key ? "#1e3a5f" : BG, border: `1px solid ${plan === key ? BLUE : BORDER}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{info.label}</div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{info.desc}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{info.value}</div>
              </div>
            ))}
          </div>
        </div>

        {error && <div style={{ fontSize: 13, color: RED, background: RED + "18", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid " + BORDER, borderRadius: 8, color: TEXT2, fontSize: 14, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={handleCreate} disabled={loading}
            style={{ flex: 2, padding: "10px", background: BLUE, border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Criando..." : `Criar · ${PLANS_INFO[plan].value}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab Dashboard ────────────────────────────────────────────────────────────
// Visão geral da rede — toggle entre dado real (hoje, ainda pequeno) e modo
// demonstração (números ilustrativos, sem marca de terceiro real nenhuma,
// pra não sugerir falsa associação com empresas que não são clientes/
// anunciantes de verdade).
function TabDashboard({ data }: { data: any }) {
  const [mode, setMode] = useState<"real" | "demo">("real")
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeMsg, setGeocodeMsg] = useState<string | null>(null)

  const clients = data?.clients ?? []
  const campaigns = data?.campaigns ?? []
  const advertisers = data?.advertisers ?? []
  const daily = data?.dailyEvents ?? []

  const online  = clients.filter((c: any) => c.player_status === "online").length
  const offline = clients.filter((c: any) => c.player_status === "offline").length
  const never   = clients.filter((c: any) => c.player_status === "never").length
  const totalTelas = clients.length
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length
  const events24h = data?.events?.last_24h ?? 0
  const eventsTotal = data?.events?.total ?? 0

  const runGeocode = async () => {
    setGeocoding(true); setGeocodeMsg(null)
    try {
      const r = await fetch("/api/admin/geocode-clients", { method: "POST" })
      const j = await r.json()
      setGeocodeMsg(r.ok ? `✅ ${j.summary?.success ?? 0} cliente(s) geocodificado(s)` : `⚠️ ${j.error || "erro"}`)
    } catch { setGeocodeMsg("⚠️ Falha ao chamar a geocodificação") }
    setGeocoding(false)
  }

  // ── Dados de demonstração — sempre fictícios, nunca marca real de terceiro ──
  const demoKpis = { telas: 1248, telasTotal: 1540, campanhas: 86, campanhasTotal: 132, execucoes: 152624, execucoesOntem: 132103, impressoes: 8951245, receita: 185430.75 }
  const demoDaily = [120,135,128,148,142,160,155,168,162,178,172,185,180,196].map((v,i) => ({ day: `d${i}`, count: v * 1000 }))
  const demoDonut = { online: 1248, offline: 208, idle: 84 }
  const demoRanking = [
    { name: "Sabor Real Alimentos", value: 2431256 },
    { name: "Banco União Digital", value: 1856421 },
    { name: "Grão Bar Cafés", value: 1247365 },
    { name: "Vero Cosméticos", value: 1102598 },
    { name: "TechMix Eletrônicos", value: 875452 },
  ]
  const demoCampaigns = [
    { name: "Verão Refrescante", advertiser: "Sabor Real Alimentos", telas: 352, progresso: 72 },
    { name: "Feito pro Futuro", advertiser: "Banco União Digital", telas: 284, progresso: 65 },
    { name: "Combo do Dia", advertiser: "Grão Bar Cafés", telas: 198, progresso: 48 },
  ]

  const fmt = (n: number) => n.toLocaleString("pt-BR")
  const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  // ── SVG helpers (sem lib externa — tudo desenhado à mão, no mesmo estilo
  // simples usado no resto do admin) ──
  function Donut({ segments, size = 130 }: { segments: { value: number; color: string }[]; size?: number }) {
    const total = segments.reduce((a, s) => a + s.value, 0) || 1
    const r = size / 2 - 12
    const c = 2 * Math.PI * r
    let offset = 0
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => {
          const frac = s.value / total
          const dash = frac * c
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={16}
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          )
          offset += dash
          return el
        })}
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill={TEXT}>{fmt(total)}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill={TEXT2}>total</text>
      </svg>
    )
  }

  function LineChart({ points, width = 560, height = 160 }: { points: number[]; width?: number; height?: number }) {
    const max = Math.max(...points, 1)
    const stepX = width / (points.length - 1)
    const coords = points.map((p, i) => [i * stepX, height - (p / max) * (height - 16) - 8])
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ")
    const areaPath = `${path} L${width},${height} L0,${height} Z`
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path d={areaPath} fill={BLUE + "22"} />
        <path d={path} fill="none" stroke={BLUE} strokeWidth={2.5} />
      </svg>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>📊 Dashboard</div>
          <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>Visão geral da rede</div>
        </div>
        <div style={{ display: "flex", background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: 3 }}>
          <button onClick={() => setMode("real")} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: mode === "real" ? BLUE : "transparent", color: mode === "real" ? "#fff" : TEXT2 }}>Dados reais</button>
          <button onClick={() => setMode("demo")} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: mode === "demo" ? PURPLE : "transparent", color: mode === "demo" ? "#fff" : TEXT2 }}>Modo demonstração</button>
        </div>
      </div>

      {mode === "demo" && (
        <div style={{ background: PURPLE + "15", border: "1px solid " + PURPLE + "44", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: PURPLE, marginBottom: 20 }}>
          ⚠️ Dados ilustrativos — nenhum número ou marca nesta tela é real. Serve pra visualizar como o dashboard fica com a rede em escala.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {mode === "real" ? (
          <>
            <DashKpiCard icon="🖥️" color={BLUE} label="Telas Online" value={fmt(online)} sub={`de ${fmt(totalTelas)} telas`} />
            <DashKpiCard icon="👥" color={GREEN} label="Clientes Ativos" value={fmt(clients.filter((c: any) => c.active).length)} sub={`de ${fmt(totalTelas)} cadastrados`} />
            <DashKpiCard icon="📢" color={AMBER} label="Campanhas Ativas" value={fmt(activeCampaigns)} sub={`de ${fmt(campaigns.length)} campanhas`} />
            <DashKpiCard icon="🏢" color={PURPLE} label="Anunciantes" value={fmt(advertisers.length)} sub="cadastrados" />
            <DashKpiCard icon="▶️" color={RED} label="Execuções (24h)" value={fmt(events24h)} sub={`${fmt(eventsTotal)} desde o início`} />
          </>
        ) : (
          <>
            <DashKpiCard icon="🖥️" color={BLUE} label="Telas Online" value={fmt(demoKpis.telas)} sub={`de ${fmt(demoKpis.telasTotal)} telas`} />
            <DashKpiCard icon="✅" color={GREEN} label="Campanhas Ativas" value={fmt(demoKpis.campanhas)} sub={`de ${fmt(demoKpis.campanhasTotal)} campanhas`} />
            <DashKpiCard icon="▶️" color={AMBER} label="Execuções Hoje" value={fmt(demoKpis.execucoes)} sub={`${fmt(demoKpis.execucoesOntem)} ontem`} />
            <DashKpiCard icon="👁️" color={PURPLE} label="Impressões Hoje" value={fmt(demoKpis.impressoes)} sub="+18,6%" />
            <DashKpiCard icon="💰" color={RED} label="Receita Estimada" value={money(demoKpis.receita)} sub="no período" />
          </>
        )}
      </div>

      {/* Gráfico + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Execuções por Dia {mode === "demo" && <span style={{ color: PURPLE, fontWeight: 400 }}>(ilustrativo)</span>}</div>
          {mode === "real" && daily.length === 0 ? (
            <div style={{ fontSize: 12, color: TEXT2, padding: "40px 0", textAlign: "center" }}>Sem execuções registradas nos últimos 14 dias ainda.</div>
          ) : (
            <LineChart points={mode === "real" ? daily.map((d: any) => d.count) : demoDaily.map(d => d.count)} />
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT2, marginTop: 6 }}>
            <span>{mode === "real" ? daily[0]?.day ?? "" : "há 14 dias"}</span>
            <span>{mode === "real" ? daily[daily.length - 1]?.day ?? "" : "hoje"}</span>
          </div>
        </div>

        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Status das Telas</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut segments={mode === "real"
              ? [{ value: online || 0.0001, color: GREEN }, { value: offline, color: RED }, { value: never, color: AMBER }]
              : [{ value: demoDonut.online, color: GREEN }, { value: demoDonut.offline, color: RED }, { value: demoDonut.idle, color: AMBER }]
            } />
            <div style={{ fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: GREEN, display: "inline-block" }} /> Online ({mode === "real" ? online : demoDonut.online})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: RED, display: "inline-block" }} /> Offline ({mode === "real" ? offline : demoDonut.offline})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: AMBER, display: "inline-block" }} /> {mode === "real" ? "Nunca conectou" : "Idle"} ({mode === "real" ? never : demoDonut.idle})</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa da rede */}
      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Mapa da Rede</div>
        {mode === "demo" ? (
          <div style={{ fontSize: 12, color: TEXT2, padding: "30px 0", textAlign: "center", border: "1px dashed " + BORDER, borderRadius: 8, marginTop: 10 }}>
            🗺️ Mapa ilustrativo — em escala, mostraria cada tela geolocalizada no país
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: TEXT2, marginBottom: 12 }}>Sem coordenadas ainda pra desenhar um mapa visual — lista de clientes por cidade abaixo.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 12 }}>
              {clients.map((c: any) => (
                <div key={c.code} style={{ fontSize: 12, color: TEXT, background: BG, borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ color: TEXT2, fontSize: 11 }}>{c.address || "sem endereço cadastrado"}</div>
                </div>
              ))}
            </div>
            <button onClick={runGeocode} disabled={geocoding} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 6, border: "1px solid " + BLUE, background: "transparent", color: BLUE, cursor: geocoding ? "not-allowed" : "pointer" }}>
              {geocoding ? "Geocodificando…" : "📍 Rodar geocodificação"}
            </button>
            {geocodeMsg && <span style={{ fontSize: 12, color: TEXT2, marginLeft: 10 }}>{geocodeMsg}</span>}
          </>
        )}
      </div>

      {/* Campanhas + Ranking */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Campanhas em Exibição {mode === "demo" && <span style={{ color: PURPLE, fontWeight: 400 }}>(ilustrativo)</span>}</div>
          {(mode === "real" ? campaigns.filter((c: any) => c.status === "active") : demoCampaigns).length === 0 ? (
            <div style={{ fontSize: 12, color: TEXT2, padding: "20px 0", textAlign: "center" }}>Nenhuma campanha ativa ainda.</div>
          ) : (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: TEXT2, textAlign: "left" }}><th style={{ paddingBottom: 8 }}>Campanha</th><th>Telas</th><th>Status</th></tr></thead>
              <tbody>
                {mode === "real"
                  ? campaigns.filter((c: any) => c.status === "active").map((c: any) => (
                    <tr key={c.id} style={{ borderTop: "1px solid " + BORDER }}>
                      <td style={{ padding: "8px 0", color: TEXT }}>{c.name}</td>
                      <td style={{ color: TEXT2 }}>{c.screen_count}</td>
                      <td style={{ color: GREEN }}>Em exibição</td>
                    </tr>
                  ))
                  : demoCampaigns.map((c, i) => (
                    <tr key={i} style={{ borderTop: "1px solid " + BORDER }}>
                      <td style={{ padding: "8px 0", color: TEXT }}>{c.name}<div style={{ color: TEXT2, fontSize: 10 }}>{c.advertiser}</div></td>
                      <td style={{ color: TEXT2 }}>{c.telas}</td>
                      <td style={{ color: GREEN }}>{c.progresso}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Ranking de Anunciantes {mode === "demo" && <span style={{ color: PURPLE, fontWeight: 400 }}>(ilustrativo)</span>}</div>
          {mode === "real" ? (
            <div style={{ fontSize: 12, color: TEXT2, padding: "20px 0", textAlign: "center" }}>Nenhum anunciante com exibições registradas ainda.</div>
          ) : (
            demoRanking.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: i > 0 ? "1px solid " + BORDER : "none", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: TEXT2 }}>{i + 1}</span><span style={{ color: TEXT }}>{r.name}</span></div>
                <span style={{ color: TEXT2 }}>{fmt(r.value)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DashKpiCard({ icon, color, label, value, sub }: { icon: string; color: string; label: string; value: string; sub: string }) {
  return (
    <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
        <div style={{ fontSize: 11, color: TEXT2 }}>{label}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>{value}</div>
      <div style={{ fontSize: 10, color: TEXT2, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

// ── Tab Clientes ──────────────────────────────────────────────────────────────
// ── Diagnóstico: busca consolidada por código, sem precisar de SQL manual ──
function TabDiagnostico() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Pareamento de dispositivos novos (aparelho instalado, ainda sem código
  // de tela vinculado) — substitui SQL manual no fluxo de ativação.
  const [pending, setPending] = useState<any[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [linkCode, setLinkCode] = useState<Record<string, string>>({})
  const [linking, setLinking] = useState<string | null>(null)
  const [linkMsg, setLinkMsg] = useState<Record<string, string>>({})

  const loadPending = () => {
    setLoadingPending(true)
    fetch("/api/admin/players/link")
      .then(r => r.json())
      .then(d => setPending(d.pending ?? []))
      .catch(() => setPending([]))
      .finally(() => setLoadingPending(false))
  }
  useEffect(() => { loadPending() }, [])

  const linkDevice = async (playerId: string) => {
    const targetCode = (linkCode[playerId] || "").trim()
    if (!targetCode) return
    setLinking(playerId); setLinkMsg(m => ({ ...m, [playerId]: "" }))
    try {
      const res = await fetch("/api/admin/players/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, code: targetCode }),
      })
      const json = await res.json()
      if (!res.ok) { setLinkMsg(m => ({ ...m, [playerId]: json.error || "Erro" })); return }
      setLinkMsg(m => ({ ...m, [playerId]: `✅ Vinculado a ${json.name}` }))
      setTimeout(loadPending, 1000)
    } catch {
      setLinkMsg(m => ({ ...m, [playerId]: "Erro de conexão" }))
    } finally {
      setLinking(null)
    }
  }

  const [discarding, setDiscarding] = useState<string | null>(null)
  const discardDevice = async (playerId: string) => {
    if (!confirm("Descartar este aparelho da lista de pareamento? Se ele abrir o app do DOOHPLAY de novo, volta a aparecer aqui.")) return
    setDiscarding(playerId)
    try {
      const res = await fetch(`/api/admin/players/link?player_id=${encodeURIComponent(playerId)}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) { setLinkMsg(m => ({ ...m, [playerId]: json.error || "Erro ao descartar" })); return }
      loadPending()
    } catch {
      setLinkMsg(m => ({ ...m, [playerId]: "Erro de conexão" }))
    } finally {
      setDiscarding(null)
    }
  }

  // Visão consolidada de todas as telas físicas de todos os clientes —
  // útil principalmente quando há mais de 1 cliente com múltiplas telas.
  const [allScreens, setAllScreens] = useState<any[]>([])
  const [loadingScreens, setLoadingScreens] = useState(true)
  const [removingScreen, setRemovingScreen] = useState<string | null>(null)

  // Diagnóstico de conexão do WhatsApp (Evolution API) — "Falha ao enviar
  // WhatsApp" pode ser bug de código OU sessão desconectada; sem isso não
  // dava pra saber qual dos dois sem abrir o painel do Evolution na mão.
  const [waStatus, setWaStatus] = useState<any>(null)
  const [waLoading, setWaLoading] = useState(false)
  const checkWhatsApp = () => {
    setWaLoading(true); setWaStatus(null)
    fetch("/api/admin/whatsapp-status")
      .then(r => r.json())
      .then(d => setWaStatus(d))
      .catch(() => setWaStatus({ connected: false, error: "Erro ao checar" }))
      .finally(() => setWaLoading(false))
  }

  const loadScreens = () => {
    setLoadingScreens(true)
    fetch("/api/admin/screens")
      .then(r => r.json())
      .then(d => setAllScreens(d.screens ?? []))
      .catch(() => setAllScreens([]))
      .finally(() => setLoadingScreens(false))
  }
  useEffect(() => { loadScreens() }, [])

  const [screenMsg, setScreenMsg] = useState<Record<string, string>>({})
  const removeScreen = async (screenId: string, label: string) => {
    if (!confirm(`Desvincular "${label}" do cliente? A tela física PARA de exibir conteúdo (volta a mostrar o código de ativação, como um aparelho novo). Não apaga o histórico do aparelho — pode ser pareado de novo depois, a qualquer cliente.`)) return
    setRemovingScreen(screenId)
    setScreenMsg(m => ({ ...m, [screenId]: "" }))
    try {
      const res = await fetch(`/api/admin/screens/${screenId}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Fase 23 (14/07/2026): achado — o botão nunca checava se o DELETE
        // deu certo, então uma falha (401, 404, erro de servidor) ficava
        // completamente silenciosa pro admin, sem nenhuma mensagem de erro
        // nem de sucesso. Agora mostra o motivo real, e NÃO recarrega a
        // lista (a tela continua lá, porque de fato não foi desvinculada).
        setScreenMsg(m => ({ ...m, [screenId]: json.error || `Erro (HTTP ${res.status})` }))
        setRemovingScreen(null)
        return
      }
      setScreenMsg(m => ({ ...m, [screenId]: "✅ Desvinculada" }))
      // Pequeno atraso pra dar tempo do admin ver a confirmação antes da
      // linha sumir da lista (loadScreens tira a tela desvinculada daqui).
      setTimeout(loadScreens, 900)
    } catch {
      setScreenMsg(m => ({ ...m, [screenId]: "Erro de conexão" }))
    }
    setRemovingScreen(null)
  }

  const search = async () => {
    if (!code.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch(`/api/admin/diagnostico?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Erro na busca"); return }
      setResult(json)
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, value, warn }: { label: string; value: any; warn?: boolean }) => (
    <div style={{ padding: "10px 14px", background: BG, borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: warn ? AMBER : TEXT, fontWeight: warn ? 700 : 500 }}>
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>📱 Status do WhatsApp (Evolution API)</div>
          <button onClick={checkWhatsApp} disabled={waLoading} style={{ fontSize: 12, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", opacity: waLoading ? 0.6 : 1 }}>
            {waLoading ? "Checando..." : "Checar conexão"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: TEXT2, marginBottom: waStatus ? 10 : 0 }}>
          "Falha ao enviar WhatsApp" no login pode ser bug de código ou sessão desconectada (precisa escanear QR de novo) — isso aqui diz qual dos dois, sem precisar abrir o painel do Evolution na mão.
        </div>
        {waStatus && (
          <div style={{ padding: 12, background: BG, borderRadius: 8, fontSize: 13, color: waStatus.connected ? "#10B981" : (waStatus.state === "connecting" ? AMBER : RED) }}>
            {waStatus.message || waStatus.error || (waStatus.connected ? "Conectado" : "Desconectado")}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>📲 Dispositivos aguardando pareamento</div>
        <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
          Aparelhos que abriram o app por baixo da primeira vez, sem código configurado. Vincule a um cliente real abaixo.
        </div>
        {/* Fase 36 (20/07/2026): link de download bem visível — achado que
            não existia nenhum lugar fácil de achar isso (a página web
            /install é um protótipo desconectado do backend real, nunca
            deveria ser usada; o /guia-instalacao aponta pra uma URL
            antiga que também não é essa). Colocado bem aqui porque é
            exatamente onde quem está instalando um aparelho novo já
            está olhando. */}
        <a
          href="https://doohplay.com.br/downloads/doohplay-player-native.apk"
          download
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 10, fontSize: 13, fontWeight: 600,
            color: "#fff", background: BLUE, borderRadius: 8,
            padding: "8px 14px", textDecoration: "none",
          }}
        >
          ⬇️ Baixar APK do player (pra instalar num aparelho novo)
        </a>
      </div>

      {loadingPending ? (
        <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Carregando…</div>
      ) : pending.length === 0 ? (
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, fontSize: 13, color: TEXT2, marginBottom: 32 }}>
          Nenhum dispositivo aguardando pareamento agora.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {pending.map((p: any) => (
            <div key={p.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{p.device_type ?? "Dispositivo"} · {p.platform ?? "—"}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>Ativado em {fmt(p.created_at)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginTop: 2, fontFamily: "monospace" }}>{p.activation_code}</div>
              </div>
              <input
                placeholder="Código do cliente (ex: BARBE332)"
                value={linkCode[p.id] || ""}
                onChange={e => setLinkCode(c => ({ ...c, [p.id]: e.target.value.toUpperCase() }))}
                style={{ background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "6px 10px", color: TEXT, fontSize: 13, width: 180 }}
              />
              <button
                onClick={() => linkDevice(p.id)}
                disabled={linking === p.id}
                style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: linking === p.id ? "not-allowed" : "pointer" }}
              >
                {linking === p.id ? "Vinculando…" : "Vincular"}
              </button>
              <button
                onClick={() => discardDevice(p.id)}
                disabled={discarding === p.id}
                title="Remove da lista — não apaga nada além deste registro de pareamento"
                style={{ background: "transparent", color: RED, border: "1px solid " + RED, borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: discarding === p.id ? "not-allowed" : "pointer" }}
              >
                {discarding === p.id ? "Descartando…" : "Descartar"}
              </button>
              {linkMsg[p.id] && (
                <span style={{ fontSize: 12, color: linkMsg[p.id].startsWith("✅") ? GREEN : RED }}>{linkMsg[p.id]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 24, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>📺 Todas as Telas ({allScreens.length})</div>
        <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
          Telas físicas pareadas em todos os clientes — renomeie ou desvincule sem precisar de SQL manual.
        </div>
      </div>

      {loadingScreens ? (
        <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Carregando…</div>
      ) : allScreens.length === 0 ? (
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, fontSize: 13, color: TEXT2, marginBottom: 32 }}>
          Nenhuma tela pareada ainda.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {allScreens.map((s: any) => (
            <div key={s.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{s.label || s.device_type} <span style={{ fontWeight: 400, color: TEXT2 }}>· {s.client_name} ({s.client_code})</span></div>
                <div style={{ fontSize: 11, color: TEXT2 }}>{s.device_type} · {s.platform} · {s.same_content ? "Mesma playlist" : "Conteúdo próprio"}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginTop: 2, fontFamily: "monospace" }}>{s.activation_code}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.online ? GREEN + "18" : RED + "18", color: s.online ? GREEN : RED }}>
                {s.online ? "Online" : "Offline"}
              </span>
              <button
                onClick={() => removeScreen(s.id, s.label || s.device_type)}
                disabled={removingScreen === s.id}
                style={{ fontSize: 11, color: RED, background: "transparent", border: "1px solid " + RED + "44", borderRadius: 6, padding: "5px 10px", cursor: removingScreen === s.id ? "not-allowed" : "pointer" }}
              >
                {removingScreen === s.id ? "Removendo…" : "Desvincular"}
              </button>
              {screenMsg[s.id] && (
                <span style={{ fontSize: 12, color: screenMsg[s.id].startsWith("✅") ? GREEN : RED }}>{screenMsg[s.id]}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 24, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Diagnóstico</div>
        <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
          Busque por código de cliente (ex: BARBE332), código de anunciante (ex: ADV...) ou UUID de campanha — sem precisar de SQL manual no Supabase.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Ex: BARBE332"
          style={{ flex: 1, background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: "10px 14px", color: TEXT, fontSize: 14 }}
        />
        <button onClick={search} disabled={loading} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {error && (
        <div style={{ background: RED + "18", border: "1px solid " + RED + "44", borderRadius: 8, padding: "12px 16px", color: RED, fontSize: 13, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 12, color: TEXT2 }}>
            Encontrado como: {result.found_as.map((f: string) => <Badge key={f} label={f} color={BLUE} />)}
          </div>

          {result.client && (
            <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>👥 Cliente</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                <Field label="Código" value={result.client.code} />
                <Field label="Nome" value={result.client.name} />
                <Field label="Cidade" value={result.client.city} warn={!result.client.city} />
                <Field label="Ativo" value={result.client.active ? "Sim" : "Não"} warn={!result.client.active} />
                <Field label="Mídias cadastradas" value={result.media_count} />
              </div>
              {result.heartbeat && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: result.heartbeat.likely_offline ? AMBER + "18" : GREEN + "18", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: result.heartbeat.likely_offline ? AMBER : GREEN, fontWeight: 600 }}>
                    {result.heartbeat.likely_offline ? "⚠️ Provavelmente offline" : "✅ Online"}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>
                    Último heartbeat há {result.heartbeat.minutes_since_last_ping} minuto(s) — {fmt(result.heartbeat.last_ping)}
                  </div>
                </div>
              )}
              {!result.heartbeat && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: RED + "18", borderRadius: 8, fontSize: 13, color: RED }}>
                  ⚠️ Nenhum registro de heartbeat encontrado pra esse player_id.
                </div>
              )}
            </div>
          )}

          {result.advertiser && (
            <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>📢 Anunciante</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                <Field label="Código" value={result.advertiser.code} />
                <Field label="Nome" value={result.advertiser.name} />
                <Field label="Email" value={result.advertiser.email} warn={!result.advertiser.email} />
                <Field label="CPF/CNPJ" value={result.advertiser.cpfCnpj} warn={!result.advertiser.cpfCnpj} />
                <Field label="Cidade" value={result.advertiser.city} warn={!result.advertiser.city} />
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: result.advertiser_ready_to_bill ? GREEN + "18" : AMBER + "18", borderRadius: 8, fontSize: 13, color: result.advertiser_ready_to_bill ? GREEN : AMBER, fontWeight: 600 }}>
                {result.advertiser_ready_to_bill ? "✅ Pronto para gerar cobrança" : "⚠️ Falta email ou CPF/CNPJ — cobrança vai falhar"}
              </div>
              {result.campaigns?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: TEXT2, marginBottom: 8 }}>Campanhas recentes</div>
                  {result.campaigns.map((c: any) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: BG, borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: TEXT }}>{c.name}</span>
                      <Badge label={c.status} color={c.status === "active" ? GREEN : c.status === "pending_payment" ? AMBER : TEXT2} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.campaign && (
            <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 14 }}>📋 Campanha</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                <Field label="Nome" value={result.campaign.name} />
                <Field label="Status" value={result.campaign.status} />
                <Field label="Orçamento" value={"budget" in result.campaign ? brl(result.campaign.budget) : "restrito"} />
                <Field label="Anunciante" value={result.campaign.advertiserCode} />
              </div>
              {result.payment && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: BG, borderRadius: 8 }}>
                  <Field label="Pagamento" value={result.payment.status} />
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 6 }}>Pago em: {fmt(result.payment.paid_at)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabClientes({ data, onRefresh, isSuperAdmin }: { data: any; onRefresh: () => void; isSuperAdmin: boolean }) {
  const [showCsv, setShowCsv] = useState(false)
  const [showNovo, setShowNovo] = useState(false)
  const [showEdit, setShowEdit] = useState<any>(null)
  const [showSub, setShowSub] = useState<any>(null)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [pricingDraft, setPricingDraft] = useState<Record<string, { screen_size: string; price_multiplier: string }>>({})
  const [savingPricing, setSavingPricing] = useState<string | null>(null)
  const { clients, subscriptions } = data
  const subMap = Object.fromEntries(subscriptions.map((s: any) => [s.code, s]))

  const draftFor = (c: any) => pricingDraft[c.code] ?? { screen_size: c.screen_size ?? "", price_multiplier: c.price_multiplier ?? "1" }

  const savePricing = async (code: string) => {
    const d = pricingDraft[code]
    if (!d) return
    setSavingPricing(code)
    try {
      const res = await fetch(`/api/clients/${code}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screen_size: d.screen_size || null, price_multiplier: d.price_multiplier || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao salvar")
      onRefresh()
    } catch (err: any) {
      alert("Erro ao salvar precificação: " + err.message)
    }
    setSavingPricing(null)
  }

  const handleDelete = async (code: string, name: string) => {
    const typed = prompt(`Isso exclui "${name}" (${code}) e todos os dados relacionados (mídia, playlist, parcerias) pra sempre. Digite o código "${code}" pra confirmar:`)
    if (typed !== code) {
      if (typed !== null) alert("Código não corresponde. Nada foi excluído.")
      return
    }
    setDeletingCode(code)
    try {
      const res = await fetch(`/api/admin/clients/${code}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao excluir")
      onRefresh()
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message)
    }
    setDeletingCode(null)
  }

  return (
    <div>
      {showCsv && <ModalCsvImport onClose={() => setShowCsv(false)} onSuccess={onRefresh} />}
      {showNovo && <ModalNovoCliente onClose={() => setShowNovo(false)} onSuccess={onRefresh} />}
      {showEdit && <ModalEditarCliente client={showEdit} onClose={() => setShowEdit(null)} onSuccess={onRefresh} />}
      {showSub && <ModalAssinatura client={showSub} onClose={() => setShowSub(null)} onSuccess={onRefresh} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>
          Clientes <span style={{ fontSize: 13, color: TEXT2, fontWeight: 400 }}>({clients.length})</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowNovo(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: GREEN + "18", border: "1px solid " + GREEN + "44", color: GREEN, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Novo Cliente
          </button>
          <button onClick={() => setShowCsv(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: BLUE + "18", border: "1px solid " + BLUE + "44", color: BLUE, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📄 Importar CSV
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {clients.map((c: any) => {
          const sub = subMap[c.code]
          const hasActiveSub = sub?.status === "ACTIVE"
          return (
            <div key={c.code} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto auto auto auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: TEXT, fontSize: 15 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: TEXT2, background: BORDER, padding: "1px 7px", borderRadius: 10 }}>{c.code}</span>
                </div>
                <div style={{ fontSize: 12, color: TEXT2 }}>{c.business_type} · {c.address ?? "Sem endereço"}{c.city ? `, ${c.city}` : ""}</div>
                <div style={{ fontSize: 11, color: TEXT2, marginTop: 3, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>📱 {c.phone ? formatPhone(c.phone) : "sem telefone"}</span>
                  <span>✉️ {c.email ?? "sem email"}</span>
                  {c.cpf_cnpj !== undefined && <span>🪪 {c.cpf_cnpj ? formatCpfCnpj(c.cpf_cnpj) : "sem CPF/CNPJ"}</span>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                  <select
                    value={draftFor(c).screen_size}
                    onChange={e => setPricingDraft(p => ({ ...p, [c.code]: { ...draftFor(c), screen_size: e.target.value } }))}
                    style={{ fontSize: 11, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "3px 6px", color: TEXT }}
                  >
                    <option value="">Tamanho da tela…</option>
                    <option value="pequena">Pequena</option>
                    <option value="media">Média</option>
                    <option value="grande">Grande</option>
                  </select>
                  <input
                    type="number" step="0.1" min="0.1" max="10"
                    value={draftFor(c).price_multiplier}
                    onChange={e => setPricingDraft(p => ({ ...p, [c.code]: { ...draftFor(c), price_multiplier: e.target.value } }))}
                    placeholder="1.0"
                    style={{ fontSize: 11, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "3px 6px", color: TEXT, width: 60 }}
                  />
                  <span style={{ fontSize: 10, color: TEXT2 }}>× multiplicador</span>
                  <button
                    onClick={() => savePricing(c.code)}
                    disabled={savingPricing === c.code}
                    style={{ fontSize: 10, background: BLUE + "18", border: "1px solid " + BLUE + "44", color: BLUE, borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}
                  >
                    {savingPricing === c.code ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>Player</div>
                <Badge label={c.player_status ?? "offline"} color={c.player_status === "online" ? GREEN : MUTED} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>Plano</div>
                <Badge label={sub?.plan ?? "—"} color={sub ? BLUE : MUTED} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>Assinatura</div>
                <Badge label={isSuperAdmin ? (sub?.status ?? "sem assinatura") : "restrito"} color={hasActiveSub ? GREEN : (isSuperAdmin ? AMBER : MUTED)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {isSuperAdmin && !hasActiveSub && (
                  <button onClick={() => setShowSub(c)}
                    style={{ fontSize: 12, background: GREEN, border: "none", borderRadius: 6, color: "white", cursor: "pointer", padding: "5px 10px", fontWeight: 600 }}>
                    💳 Assinar
                  </button>
                )}
                <Link href={"/dashboard/local/" + c.code} target="_blank"
                  style={{ fontSize: 12, color: PURPLE, textDecoration: "none", padding: "5px 10px", border: "1px solid " + PURPLE + "44", borderRadius: 6 }}>
                  Dashboard
                </Link>
                <button
                  onClick={() => setShowEdit(c)}
                  style={{ fontSize: 12, color: BLUE, background: "transparent", border: "1px solid " + BLUE + "44", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(c.code, c.name)}
                  disabled={deletingCode === c.code}
                  style={{ fontSize: 12, color: RED, background: "transparent", border: "1px solid " + RED + "44", borderRadius: 6, padding: "5px 10px", cursor: deletingCode === c.code ? "not-allowed" : "pointer" }}
                >
                  {deletingCode === c.code ? "Excluindo…" : "🗑 Excluir"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabAssinaturas({ data }: { data: any }) {
  const { subscriptions, clients } = data
  const clientMap = Object.fromEntries(clients.map((c: any) => [c.code, c]))
  const mrr = subscriptions.filter((s: any) => s.status === "ACTIVE").reduce((a: number, s: any) => a + Number(s.value), 0)
  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="MRR"                value={brl(mrr)}                                                                                    color={GREEN}  />
        <KpiCard label="Assinaturas Ativas" value={subscriptions.filter((s: any) => s.status === "ACTIVE").length}                              color={BLUE}   />
        <KpiCard label="ARR Projetado"      value={brl(mrr * 12)}                                                                               color={PURPLE} />
        <KpiCard label="Ticket Médio"       value={brl(subscriptions.length > 0 ? mrr / subscriptions.length : 0)} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Assinaturas</div>
      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid " + BORDER }}>
              {["Cliente","Plano","Valor","Status","Asaas ID","Criado em"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s: any, i: number) => (
              <tr key={s.code} style={{ borderBottom: i < subscriptions.length - 1 ? "1px solid " + BORDER : "none" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: TEXT }}>{clientMap[s.code]?.name ?? s.code}</div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{s.code}</div>
                </td>
                <td style={{ padding: "12px 16px" }}><Badge label={s.plan} color={BLUE} /></td>
                <td style={{ padding: "12px 16px", color: GREEN, fontWeight: 600 }}>{brl(s.value)}</td>
                <td style={{ padding: "12px 16px" }}><Badge label={s.status} color={s.status === "ACTIVE" ? GREEN : AMBER} /></td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: TEXT2, fontFamily: "monospace" }}>{s.asaas_subscription_id ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: TEXT2 }}>{fmt(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabAnunciantes({ data, isSuperAdmin, onRefresh }: { data: any; isSuperAdmin: boolean; onRefresh: () => void }) {
  const { advertisers, campaigns } = data
  const campByAdv = campaigns.reduce((acc: any, c: any) => { acc[c.advertiserCode] = (acc[c.advertiserCode] ?? 0) + 1; return acc }, {})
  const [deletingCode, setDeletingCode] = useState<string | null>(null)

  const handleDelete = async (code: string, name: string) => {
    const typed = prompt(`Isso exclui o anunciante "${name}" (${code}) e todas as campanhas/mídias dele pra sempre. Isso NÃO afeta a conta de dono de tela, caso exista uma com o mesmo código. Digite o código "${code}" pra confirmar:`)
    if (typed !== code) {
      if (typed !== null) alert("Código não corresponde. Nada foi excluído.")
      return
    }
    setDeletingCode(code)
    try {
      const res = await fetch(`/api/admin/advertisers/${code}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao excluir")
      onRefresh()
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message)
    }
    setDeletingCode(null)
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="Anunciantes"     value={advertisers.length}                                                                          color={BLUE}   />
        <KpiCard label="Campanhas"       value={campaigns.length}                                                                            color={PURPLE} />
        <KpiCard label="Ativas"          value={campaigns.filter((c: any) => c.status === "active").length}                                  color={GREEN}  />
        {isSuperAdmin && (
          <KpiCard label="Invest. Total"   value={brl(campaigns.reduce((a: number, c: any) => a + Number(c.budget ?? 0), 0))}                  color={AMBER}  />
        )}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Anunciantes</div>
      {advertisers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: SURFACE, borderRadius: 12, border: "1px dashed " + BORDER, color: TEXT2 }}>Nenhum anunciante cadastrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {advertisers.map((a: any) => (
            <div key={a.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto auto auto auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 600, color: TEXT, marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>{a.email ?? "—"} · {a.phone ?? "—"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: PURPLE }}>{campByAdv[a.code] ?? 0}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>Campanhas</div>
              </div>
              <span style={{ fontSize: 11, color: TEXT2, background: BORDER, padding: "2px 8px", borderRadius: 10 }}>#{a.code}</span>
              <Link href={"/anunciante/" + a.code} target="_blank" style={{ fontSize: 12, color: BLUE, textDecoration: "none", padding: "5px 10px", border: "1px solid " + BLUE + "44", borderRadius: 6 }}>Portal</Link>
              <button
                onClick={() => handleDelete(a.code, a.name)}
                disabled={deletingCode === a.code}
                style={{ fontSize: 12, color: RED, background: "transparent", border: "1px solid " + RED + "44", borderRadius: 6, padding: "5px 10px", cursor: deletingCode === a.code ? "not-allowed" : "pointer" }}
              >
                {deletingCode === a.code ? "Excluindo…" : "🗑 Excluir"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabAlertas({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const alerts: any[] = data.duplicateAlerts ?? []
  const pending = alerts.filter(a => !a.resolved)

  const markResolved = async (id: string) => {
    try {
      await fetch("/api/admin/duplicate-alerts/" + id, { method: "PATCH" })
      onRefresh()
    } catch {}
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="A verificar" value={pending.length} color={pending.length > 0 ? AMBER : GREEN} />
        <KpiCard label="Total já detectado" value={alerts.length} color={BLUE} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Telefones cadastrados como dono de tela E anunciante</div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 16 }}>
        Não é necessariamente um problema — pode ser um dono de tela anunciando de propósito nas telas de outros parceiros. Mas também é o padrão exato de quando alguém usa o portal errado por engano para fazer upload do próprio conteúdo. Vale dar uma olhada e confirmar com a pessoa se tiver dúvida.
      </div>
      {alerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: SURFACE, borderRadius: 12, border: "1px dashed " + BORDER, color: TEXT2 }}>
          Nenhum cadastro duplicado detectado ainda.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((a: any) => (
            <div key={a.id} style={{ background: SURFACE, border: "1px solid " + (a.resolved ? BORDER : AMBER + "66"), borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr auto auto", alignItems: "center", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>DONO DE TELA</div>
                <div style={{ fontWeight: 600, color: TEXT }}>{a.studio_client_name ?? "—"}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>#{a.studio_client_code ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 4 }}>ANUNCIANTE</div>
                <div style={{ fontWeight: 600, color: TEXT }}>{a.advertiser_name ?? "—"}</div>
                <div style={{ fontSize: 12, color: TEXT2 }}>#{a.advertiser_code ?? "—"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: TEXT2 }}>{a.phone}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>{new Date(a.detected_at).toLocaleDateString("pt-BR")}</div>
              </div>
              {a.resolved ? (
                <span style={{ fontSize: 11, color: GREEN, background: GREEN + "22", padding: "4px 10px", borderRadius: 10 }}>Resolvido</span>
              ) : (
                <button onClick={() => markResolved(a.id)} style={{ fontSize: 12, color: TEXT, background: "transparent", border: "1px solid " + BORDER, borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                  Marcar resolvido
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabEventos({ data }: { data: any }) {
  const { events, blocks } = data
  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="Total de Eventos"  value={events.total?.toLocaleString("pt-BR")}    color={BLUE}   />
        <KpiCard label="Últimas 24h"       value={events.last_24h?.toLocaleString("pt-BR")} color={GREEN}  />
        <KpiCard label="Últimos 7 dias"    value={events.last_7d?.toLocaleString("pt-BR")}  color={PURPLE} />
        <KpiCard label="Blocos Totais"     value={blocks.total?.toLocaleString("pt-BR")}    />
        <KpiCard label="Blocos Ancorados"  value={blocks.anchored?.toLocaleString("pt-BR")} color={AMBER}
          sub={Math.round((blocks.anchored / blocks.total) * 100) + "% do total"} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/explorer" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: SURFACE, border: "1px solid " + BORDER, color: TEXT, textDecoration: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13 }}>
          🔍 ProofChain Explorer
        </Link>
      </div>
    </div>
  )
}

// ── Fase 13 · Usuários e permissões (só super_admin acessa) ────────────────
function TabUsuarios() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("operador")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users ?? [])).catch(() => setUsers([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Nome, email e senha (mín. 8 caracteres) são obrigatórios"); return
    }
    setError(""); setCreating(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao criar")
      setName(""); setEmail(""); setPassword(""); setRole("operador")
      load()
    } catch (err: any) {
      setError(err.message || "Erro ao criar")
    }
    setCreating(false)
  }

  const toggleActive = async (u: any) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, active: !u.active }),
    })
    load()
  }

  const changeRole = async (u: any, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role: newRole }),
    })
    load()
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>🔐 Usuários e permissões</div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 20 }}>
        Cada admin tem seu próprio login. <b>Super admin</b> vê tudo, incluindo Assinaturas/financeiro.
        <b> Operador</b> vê todas as abas, exceto Assinaturas. O login mestre (env) continua funcionando sempre, como chave de emergência.
      </div>

      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: TEXT }}>Adicionar admin</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Senha (mín. 8)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Papel</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              <option value="operador">Operador</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <button onClick={create} disabled={creating} style={{ fontSize: 13, fontWeight: 600, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer", opacity: creating ? 0.6 : 1 }}>
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: RED, marginTop: 8 }}>⚠️ {error}</div>}
      </div>

      {loading ? <div style={{ color: TEXT2 }}>Carregando...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map(u => (
            <div key={u.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{u.name} {!u.active && <span style={{ color: RED, fontSize: 11 }}> · inativo</span>}</div>
                <div style={{ fontSize: 11, color: TEXT2 }}>
                  {u.email} · {u.last_login_at ? `último login ${new Date(u.last_login_at).toLocaleString("pt-BR")}` : "nunca logou"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={u.role} onChange={e => changeRole(u, e.target.value)} style={{ fontSize: 12, background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "6px 8px", color: TEXT }}>
                  <option value="operador">Operador</option>
                  <option value="super_admin">Super admin</option>
                </select>
                <button onClick={() => toggleActive(u)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, border: "1px solid " + (u.active ? RED : GREEN), background: "transparent", color: u.active ? RED : GREEN, cursor: "pointer" }}>
                  {u.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ color: TEXT2, fontSize: 13 }}>Nenhum admin cadastrado ainda — só o login mestre existe.</div>}
        </div>
      )}
    </div>
  )
}

// ── Galeria de Exemplos (biblioteca de mídia pronta por segmento) ──────────
function TabExemplos() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [niche, setNiche] = useState("barbearia")
  const [name, setName] = useState("")
  const [duration, setDuration] = useState("15")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/media-examples")
      .then(r => r.json())
      .then(d => setItems(d.examples ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const upload = async () => {
    if (!file) { setError("Escolha um arquivo"); return }
    if (!name.trim()) { setError("Dê um nome pro exemplo"); return }
    setError(""); setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("niche", niche)
      form.append("name", name)
      form.append("duration", duration)
      const res = await fetch("/api/admin/media-examples", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar")
      setName(""); setFile(null)
      load()
    } catch (err: any) {
      setError(err.message || "Erro ao enviar")
    }
    setUploading(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id)
    try {
      await fetch(`/api/admin/media-examples/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      })
      load()
    } catch {}
    setTogglingId(null)
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteExample = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}" definitivamente? Isso apaga o arquivo do R2 também — não tem como desfazer.`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/media-examples/${id}`, { method: "DELETE" })
      load()
    } catch {}
    setDeletingId(null)
  }

  const NICHES = ["barbearia", "padaria", "salao", "academia", "restaurante", "generico"]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>📚 Galeria de Exemplos</div>
        <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
          Mídia pronta por segmento — cliente sem conteúdo próprio pode usar direto na tela dele, com 1 clique. Exemplos do nicho "generico" aparecem pra todo mundo.
        </div>
      </div>

      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Adicionar novo exemplo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Segmento</label>
            <select value={niche} onChange={e => setNiche(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Duração (vídeo)</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              {[10, 15, 20, 30].map(d => <option key={d} value={d}>{d}s</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Nome do exemplo</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Promoção Corte + Barba" style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: TEXT2 }} />
        </div>
        {error && <div style={{ fontSize: 12, color: RED, marginBottom: 10 }}>⚠️ {error}</div>}
        <button onClick={upload} disabled={uploading} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
          {uploading ? "Enviando…" : "Adicionar à galeria"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: TEXT2 }}>Carregando…</div>
      ) : items.length === 0 ? (
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, fontSize: 13, color: TEXT2 }}>
          Nenhum exemplo cadastrado ainda — adicione o primeiro acima.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {items.map((ex: any) => (
            <div key={ex.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden", opacity: ex.active ? 1 : 0.5 }}>
              <div style={{ height: 90, background: BG }}>
                {ex.type === "video"
                  ? <video src={ex.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                  : <img src={ex.url} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name}</div>
                <div style={{ fontSize: 10, color: TEXT2, marginBottom: 6 }}>{ex.niche}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => toggleActive(ex.id, ex.active)}
                    disabled={togglingId === ex.id}
                    style={{ flex: 1, fontSize: 10, fontWeight: 600, padding: "4px", borderRadius: 5, border: "1px solid " + BORDER, background: ex.active ? RED + "10" : GREEN + "10", color: ex.active ? RED : GREEN, cursor: togglingId === ex.id ? "not-allowed" : "pointer" }}
                  >
                    {togglingId === ex.id ? "…" : ex.active ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    onClick={() => deleteExample(ex.id, ex.name)}
                    disabled={deletingId === ex.id}
                    title="Excluir definitivamente"
                    style={{ fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 5, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, cursor: deletingId === ex.id ? "not-allowed" : "pointer" }}
                  >
                    {deletingId === ex.id ? "…" : "🗑"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Editor visual de layout (Fase 4) — arrastar, redimensionar, remover
// blocos e escolher o conteúdo de cada um. Usado dentro de TabTemplates.
const LAYOUT_CONTENT_TYPES = [
  { value: "main_rotation", label: "Principal (dono+anunciante+rede+institucional)" },
  { value: "ad_only", label: "Só anúncio" },
  { value: "clock", label: "Relógio" },
  { value: "weather", label: "Clima" },
  { value: "stocks", label: "Bolsa" },
  { value: "news", label: "Notícias" },
  { value: "poll", label: "Enquete" },
]
const ZONE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#EF4444"]

function LayoutEditor({ clientCode, onFinalize, initialZones, initialOrientation }: {
  clientCode?: string
  onFinalize?: (zones: any[], orientation: "horizontal" | "vertical") => void
  initialZones?: any[]
  initialOrientation?: "horizontal" | "vertical"
}) {
  const [presets, setPresets] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>(initialZones ?? [])
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(initialOrientation ?? "horizontal")
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const dragState = useRef<{ mode: "move" | "resize"; zoneId: string; startX: number; startY: number; orig: any } | null>(null)
  const standalone = !clientCode // modo avulso — não vincula a nenhum cliente/tela

  const canvasW = orientation === "horizontal" ? 560 : 220
  const canvasH = orientation === "horizontal" ? 315 : 391

  useEffect(() => {
    setLoading(true)
    const url = clientCode ? `/api/admin/layout-templates?client_code=${encodeURIComponent(clientCode)}` : "/api/admin/layout-templates"
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setPresets(d.presets ?? [])
        if (initialZones && initialZones.length > 0) {
          // já veio um layout pronto pra editar (reaproveita, não sobrescreve)
        } else if (d.current) {
          setZones(d.current.zones)
          setOrientation(d.current.orientation)
        } else {
          setZones([{ id: "z1", x: 0, y: 0, w: 100, h: 100, content_type: "main_rotation" }])
        }
      })
      .catch(() => setPresets([]))
      .finally(() => setLoading(false))
  }, [clientCode])

  const applyPreset = (preset: any) => {
    setZones(preset.zones.map((z: any) => ({ ...z })))
    setOrientation(preset.orientation)
    setSelectedZone(null)
  }

  const onMouseMove = (e: MouseEvent) => {
    const ds = dragState.current
    if (!ds) return
    const dxPct = ((e.clientX - ds.startX) / canvasW) * 100
    const dyPct = ((e.clientY - ds.startY) / canvasH) * 100
    setZones(prev => prev.map(z => {
      if (z.id !== ds.zoneId) return z
      if (ds.mode === "move") {
        const x = Math.max(0, Math.min(100 - ds.orig.w, ds.orig.x + dxPct))
        const y = Math.max(0, Math.min(100 - ds.orig.h, ds.orig.y + dyPct))
        return { ...z, x: Math.round(x), y: Math.round(y) }
      }
      const w = Math.max(8, Math.min(100 - ds.orig.x, ds.orig.w + dxPct))
      const h = Math.max(8, Math.min(100 - ds.orig.y, ds.orig.h + dyPct))
      return { ...z, w: Math.round(w), h: Math.round(h) }
    }))
  }

  const onMouseUp = () => {
    dragState.current = null
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }

  const onZoneMouseDown = (e: React.MouseEvent, zoneId: string, mode: "move" | "resize") => {
    e.stopPropagation()
    e.preventDefault()
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return
    setSelectedZone(zoneId)
    dragState.current = { mode, zoneId, startX: e.clientX, startY: e.clientY, orig: { ...zone } }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  const addZone = () => {
    const id = "z" + Date.now().toString(36)
    setZones(prev => [...prev, { id, x: 10, y: 10, w: 30, h: 30, content_type: "main_rotation" }])
  }

  const removeZone = (zoneId: string) => {
    setZones(prev => prev.filter(z => z.id !== zoneId))
    if (selectedZone === zoneId) setSelectedZone(null)
  }

  const updateZoneType = (zoneId: string, contentType: string) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, content_type: contentType } : z))
  }

  const save = async () => {
    if (zones.length === 0) { setMessage("⚠️ Adicione pelo menos um bloco"); return }

    if (standalone && onFinalize) {
      onFinalize(zones, orientation)
      setMessage("✅ Layout pronto — role pra baixo pra escolher o conteúdo de cada bloco")
      return
    }

    setSaving(true); setMessage("")
    try {
      const res = await fetch("/api/admin/layout-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_code: clientCode, name: "Layout personalizado", orientation, zones }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao salvar")
      setMessage("✅ Layout salvo!")
    } catch (err: any) {
      setMessage("⚠️ " + (err.message || "Erro ao salvar"))
    }
    setSaving(false)
  }

  if (loading) return <div style={{ color: TEXT2, fontSize: 13 }}>Carregando editor...</div>

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid " + BORDER, paddingTop: 20 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: TEXT }}>🎨 Editor de layout personalizado</div>
      <div style={{ fontSize: 11, color: TEXT2, marginBottom: 12 }}>
        Clica num modelo pronto pra começar, depois arrasta pra mover e puxa o cantinho pra redimensionar. Clica num bloco pra trocar o conteúdo ou remover.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {presets.map((p: any) => (
          <button key={p.id} onClick={() => applyPreset(p)} style={{
            fontSize: 11, padding: "6px 10px", borderRadius: 6, border: "1px solid " + BORDER,
            background: BG, color: TEXT2, cursor: "pointer",
          }}>{p.orientation === "vertical" ? "📱" : "🖥️"} {p.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{
            width: canvasW, height: canvasH, position: "relative",
            background: "#0F172A", border: "1px solid " + BORDER, borderRadius: 8,
            overflow: "hidden", userSelect: "none",
          }} onMouseDown={() => setSelectedZone(null)}>
            {zones.map((z, i) => (
              <div key={z.id}
                onMouseDown={(e) => onZoneMouseDown(e, z.id, "move")}
                style={{
                  position: "absolute",
                  left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
                  background: ZONE_COLORS[i % ZONE_COLORS.length] + (selectedZone === z.id ? "55" : "33"),
                  border: "2px solid " + ZONE_COLORS[i % ZONE_COLORS.length] + (selectedZone === z.id ? "" : "88"),
                  cursor: "move", display: "flex", alignItems: "center", justifyContent: "center",
                  boxSizing: "border-box",
                }}>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, textAlign: "center", padding: 2 }}>
                  {LAYOUT_CONTENT_TYPES.find(c => c.value === z.content_type)?.label.split(" ")[0] ?? z.content_type}
                </span>
                <div
                  onMouseDown={(e) => onZoneMouseDown(e, z.id, "resize")}
                  style={{
                    position: "absolute", right: 0, bottom: 0, width: 14, height: 14,
                    background: ZONE_COLORS[i % ZONE_COLORS.length], cursor: "nwse-resize",
                    borderTopLeftRadius: 4,
                  }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={addZone} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 6, border: "1px solid " + BORDER, background: BG, color: TEXT2, cursor: "pointer" }}>+ Adicionar bloco</button>
            <button onClick={() => setOrientation(o => o === "horizontal" ? "vertical" : "horizontal")} style={{ fontSize: 12, padding: "8px 14px", borderRadius: 6, border: "1px solid " + BORDER, background: BG, color: TEXT2, cursor: "pointer" }}>
              {orientation === "horizontal" ? "🖥️ Horizontal" : "📱 Vertical"} (trocar)
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          {zones.map((z, i) => (
            <div key={z.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: 8, marginBottom: 6,
              background: selectedZone === z.id ? BORDER : "transparent", borderRadius: 6,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: ZONE_COLORS[i % ZONE_COLORS.length], flexShrink: 0 }} />
              <select value={z.content_type} onChange={e => updateZoneType(z.id, e.target.value)} style={{ flex: 1, fontSize: 12, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "5px 6px", color: TEXT }}>
                {LAYOUT_CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={() => removeZone(z.id)} style={{ fontSize: 12, color: RED, background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {message && <div style={{ fontSize: 12, marginTop: 12 }}>{message}</div>}
      <button onClick={save} disabled={saving} style={{ marginTop: 12, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Salvando..." : standalone ? "Usar esse layout" : "Salvar layout personalizado"}
      </button>
    </div>
  )
}

// ── Enquetes (Fase 7) — interatividade básica via QR code ──
function TabEnquetes({ data }: { data: any }) {
  const { clients } = data
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientCode, setClientCode] = useState("")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<Record<string, any>>({})

  const load = () => {
    setLoading(true)
    fetch("/api/admin/polls")
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const loadResult = async (id: string) => {
    const r = await fetch(`/api/polls/${id}`).then(r => r.json())
    setResults(prev => ({ ...prev, [id]: r }))
  }

  const updateOption = (i: number, value: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? value : o))
  }
  const addOption = () => { if (options.length < 4) setOptions(prev => [...prev, ""]) }
  const removeOption = (i: number) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }

  const create = async () => {
    const clean = options.map(o => o.trim()).filter(Boolean)
    if (!clientCode) { setError("Escolha um cliente"); return }
    if (!question.trim()) { setError("Escreva a pergunta"); return }
    if (clean.length < 2) { setError("Precisa de pelo menos 2 opções"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/admin/polls", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_code: clientCode, question: question.trim(), options: clean }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao criar")
      setQuestion(""); setOptions(["", ""])
      load()
    } catch (err: any) {
      setError(err.message || "Erro ao criar")
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/polls?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm("Remover essa enquete e todos os votos?")) return
    await fetch(`/api/admin/polls?id=${id}`, { method: "DELETE" })
    load()
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>🗳️ Enquetes</div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 20 }}>
        Interatividade básica — as telas são só de exibição, então quem vê escaneia o QR e vota pelo celular.
        Resultado aparece ao vivo na tela (atualiza a cada 15s).
      </div>

      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, color: TEXT }}>Nova enquete</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Cliente</label>
          <select value={clientCode} onChange={e => setClientCode(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
            <option value="">Selecione...</option>
            {clients?.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Pergunta</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex: Qual corte você mais gosta?" style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Opções (2 a 4)</label>
          {options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Opção ${i + 1}`} style={{ flex: 1, background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "7px 9px", color: TEXT, fontSize: 13 }} />
              {options.length > 2 && <button onClick={() => removeOption(i)} style={{ color: RED, background: "transparent", border: "none", cursor: "pointer", fontSize: 13 }}>✕</button>}
            </div>
          ))}
          {options.length < 4 && <button onClick={addOption} style={{ fontSize: 12, background: "transparent", border: "1px dashed " + BORDER, borderRadius: 6, padding: "6px 12px", color: TEXT2, cursor: "pointer" }}>+ Adicionar opção</button>}
        </div>
        {error && <div style={{ color: RED, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
        <button onClick={create} disabled={saving} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Criando..." : "Criar enquete"}
        </button>
      </div>

      <div style={{ fontWeight: 600, marginBottom: 12, color: TEXT }}>Enquetes cadastradas</div>
      {loading ? <div style={{ color: TEXT2, fontSize: 13 }}>Carregando...</div> : items.length === 0 ? (
        <div style={{ color: TEXT2, fontSize: 13 }}>Nenhuma enquete ainda.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it: any) => {
            const r = results[it.id]
            return (
              <div key={it.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: TEXT, fontSize: 13 }}>{it.client_code} — {it.question}</div>
                    <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{it.options.join(" · ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={() => loadResult(it.id)} style={{ fontSize: 11, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "4px 8px", color: TEXT2, cursor: "pointer" }}>Ver resultado</button>
                    <button onClick={() => toggleActive(it.id, it.active)} style={{ fontSize: 11, background: it.active ? "#10B98122" : BG, border: "1px solid " + (it.active ? "#10B981" : BORDER), borderRadius: 5, padding: "4px 8px", color: it.active ? "#10B981" : TEXT2, cursor: "pointer" }}>
                      {it.active ? "Ativa" : "Inativa"}
                    </button>
                    <button onClick={() => remove(it.id)} style={{ color: RED, background: "transparent", border: "none", cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                </div>
                {r && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
                    {r.options.map((opt: string, i: number) => {
                      const pct = r.total > 0 ? Math.round((r.counts[i] / r.total) * 100) : 0
                      return (
                        <div key={i} style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TEXT2, marginBottom: 2 }}>
                            <span>{opt}</span><span>{pct}% ({r.counts[i]})</span>
                          </div>
                          <div style={{ height: 5, background: BG, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: pct + "%", background: BLUE, borderRadius: 3 }} />
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ fontSize: 10, color: TEXT2, marginTop: 4 }}>{r.total} voto(s) no total</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── Gestão de frota em escala (Fase 6) — visão de rede inteira, tags,
// grupos administrativos e ação em massa (aplicar layout a um grupo) ──
function TabFrota({ data }: { data: any }) {
  const { clients } = data
  const [screens, setScreens] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newGroupName, setNewGroupName] = useState("")
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [presets, setPresets] = useState<any[]>([])
  const [chosenLayoutId, setChosenLayoutId] = useState("")
  const [message, setMessage] = useState("")
  const [tagDraft, setTagDraft] = useState<Record<string, string>>({})

  // Adicionar tela nova a um cliente já existente
  const [pendingDevices, setPendingDevices] = useState<any[]>([])
  const [newScreenClient, setNewScreenClient] = useState("")
  const [newScreenPlayerId, setNewScreenPlayerId] = useState("")
  const [newScreenLabel, setNewScreenLabel] = useState("")
  const [addingScreen, setAddingScreen] = useState(false)
  const [addScreenMsg, setAddScreenMsg] = useState("")

  const loadPendingDevices = () => {
    fetch("/api/admin/players/link").then(r => r.json()).then(d => setPendingDevices(d.pending ?? [])).catch(() => {})
  }

  const addScreen = async () => {
    if (!newScreenClient || !newScreenPlayerId || !newScreenLabel.trim()) {
      setAddScreenMsg("⚠️ Preencha cliente, dispositivo e nome da tela"); return
    }
    setAddingScreen(true); setAddScreenMsg("")
    try {
      const res = await fetch("/api/admin/screens/add", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_code: newScreenClient, player_id: newScreenPlayerId, label: newScreenLabel.trim() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao adicionar tela")
      setAddScreenMsg("✅ Tela adicionada!")
      setNewScreenPlayerId(""); setNewScreenLabel("")
      loadPendingDevices(); load()
    } catch (err: any) {
      setAddScreenMsg("⚠️ " + (err.message || "Erro ao adicionar"))
    }
    setAddingScreen(false)
  }

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin/fleet").then(r => r.json()),
      fetch("/api/admin/layout-templates").then(r => r.json()),
    ]).then(([fleet, layouts]) => {
      setScreens(fleet.screens ?? [])
      setGroups(fleet.groups ?? [])
      setPresets(layouts.presets ?? [])
    }).catch(() => { setScreens([]); setGroups([]) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load(); loadPendingDevices() }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    await fetch("/api/admin/fleet", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })
    setNewGroupName("")
    load()
  }

  const addSelectedToGroup = async (groupId: string) => {
    if (selected.size === 0) return
    await fetch("/api/admin/fleet/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, screen_ids: Array.from(selected) }),
    })
    setSelected(new Set())
    load()
  }

  const removeFromGroup = async (groupId: string, screenId: string) => {
    await fetch(`/api/admin/fleet/members?group_id=${groupId}&screen_id=${screenId}`, { method: "DELETE" })
    load()
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Remover esse grupo? As telas continuam existindo, só o agrupamento some.")) return
    await fetch(`/api/admin/fleet?group_id=${groupId}`, { method: "DELETE" })
    if (activeGroupId === groupId) setActiveGroupId(null)
    load()
  }

  const applyBulkLayout = async (groupId: string) => {
    if (!chosenLayoutId) { setMessage("⚠️ Escolha um layout primeiro"); return }
    setMessage("Aplicando...")
    try {
      const res = await fetch("/api/admin/fleet/bulk-layout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, layout_template_id: chosenLayoutId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao aplicar")
      setMessage(`✅ Layout aplicado a ${d.applied} tela(s)`)
    } catch (err: any) {
      setMessage("⚠️ " + (err.message || "Erro ao aplicar"))
    }
  }

  const saveTags = async (screenId: string) => {
    const raw = tagDraft[screenId] ?? ""
    const tags = raw.split(",").map(t => t.trim()).filter(Boolean)
    await fetch("/api/admin/fleet/tags", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screen_id: screenId, tags }),
    })
    load()
  }

  const onlineCount = screens.filter(s => s.online).length

  if (loading) return <div style={{ color: TEXT2, fontSize: 13 }}>Carregando frota...</div>

  const activeGroup = groups.find((g: any) => g.id === activeGroupId)

  return (
    <div>
      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, color: TEXT, marginBottom: 4 }}>➕ Adicionar tela a um cliente existente</div>
        <div style={{ fontSize: 11, color: TEXT2, marginBottom: 12 }}>
          Pro dispositivo aparecer na lista abaixo, ele precisa ter aberto o app do DOOHPLAY pelo menos uma vez (fica "aguardando pareamento" até ser vinculado).
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Cliente</label>
            <select value={newScreenClient} onChange={e => setNewScreenClient(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              <option value="">Selecione...</option>
              {clients?.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Dispositivo (aguardando pareamento)</label>
            <select value={newScreenPlayerId} onChange={e => setNewScreenPlayerId(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              <option value="">Selecione...</option>
              {pendingDevices.map((p: any) => <option key={p.id} value={p.id}>{p.device_type || p.platform || p.id.slice(0, 8)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Nome da tela</label>
            <input value={newScreenLabel} onChange={e => setNewScreenLabel(e.target.value)} placeholder="Ex: TV Recepção" style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <button onClick={addScreen} disabled={addingScreen} style={{ fontSize: 13, fontWeight: 600, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer", opacity: addingScreen ? 0.6 : 1 }}>
            {addingScreen ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
        {pendingDevices.length === 0 && <div style={{ fontSize: 11, color: TEXT2, marginTop: 8 }}>Nenhum dispositivo aguardando pareamento no momento.</div>}
        {addScreenMsg && <div style={{ fontSize: 12, marginTop: 8 }}>{addScreenMsg}</div>}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>🖥️ Gestão de Frota</div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 20 }}>
        Visão de todas as telas da rede, de todos os clientes juntos — {onlineCount} de {screens.length} online agora.
        Agrupe telas (mesmo de clientes diferentes) pra aplicar layout em massa.
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Lista de telas */}
        <div style={{ flex: 2 }}>
          <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden" }}>
            {screens.map((s: any) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderBottom: "1px solid " + BORDER,
              }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.online ? "#10B981" : "#EF4444", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{s.client_name} <span style={{ color: TEXT2, fontWeight: 400 }}>· {s.label}</span></div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>
                    {s.online ? "Online agora" : s.last_ping ? `Offline · visto por último ${new Date(s.last_ping).toLocaleString("pt-BR")}` : "Nunca conectou"}
                  </div>
                </div>
                <input
                  placeholder="tags separadas por vírgula"
                  defaultValue={(s.tags || []).join(", ")}
                  onChange={e => setTagDraft(prev => ({ ...prev, [s.id]: e.target.value }))}
                  onBlur={() => saveTags(s.id)}
                  style={{ width: 180, fontSize: 11, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "5px 8px", color: TEXT }}
                />
              </div>
            ))}
            {screens.length === 0 && <div style={{ padding: 20, color: TEXT2, fontSize: 13 }}>Nenhuma tela cadastrada ainda.</div>}
          </div>
        </div>

        {/* Grupos */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, color: TEXT, marginBottom: 10 }}>Grupos</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Nome do grupo novo"
                style={{ flex: 1, fontSize: 12, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "6px 8px", color: TEXT }} />
              <button onClick={createGroup} style={{ fontSize: 12, background: BLUE, color: "#fff", border: "none", borderRadius: 5, padding: "6px 10px", cursor: "pointer" }}>+ Criar</button>
            </div>

            {groups.map((g: any) => (
              <div key={g.id} style={{ marginBottom: 10, padding: 10, background: BG, borderRadius: 8, border: "1px solid " + (activeGroupId === g.id ? BLUE : BORDER), cursor: "pointer" }}
                onClick={() => setActiveGroupId(g.id === activeGroupId ? null : g.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{g.name}</span>
                  <span style={{ fontSize: 11, color: TEXT2 }}>{g.screen_ids?.length ?? 0} tela(s)</span>
                </div>
              </div>
            ))}
            {groups.length === 0 && <div style={{ fontSize: 12, color: TEXT2 }}>Nenhum grupo ainda. Selecione telas na lista e crie um grupo.</div>}

            {selected.size > 0 && groups.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 6 }}>{selected.size} tela(s) selecionada(s) — adicionar a:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {groups.map((g: any) => (
                    <button key={g.id} onClick={() => addSelectedToGroup(g.id)} style={{ fontSize: 11, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "4px 8px", color: TEXT2, cursor: "pointer" }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeGroup && (
            <div style={{ marginTop: 14, background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: TEXT }}>{activeGroup.name}</div>
                <button onClick={() => deleteGroup(activeGroup.id)} style={{ fontSize: 11, color: RED, background: "transparent", border: "none", cursor: "pointer" }}>Remover grupo</button>
              </div>

              {(activeGroup.screen_ids || []).map((sid: string) => {
                const s = screens.find((sc: any) => sc.id === sid)
                if (!s) return null
                return (
                  <div key={sid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ color: TEXT2 }}>{s.client_name} · {s.label}</span>
                    <button onClick={() => removeFromGroup(activeGroup.id, sid)} style={{ color: RED, background: "transparent", border: "none", cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                )
              })}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
                <div style={{ fontSize: 11, color: TEXT2, marginBottom: 6 }}>Aplicar layout a todo o grupo:</div>
                <select value={chosenLayoutId} onChange={e => setChosenLayoutId(e.target.value)} style={{ width: "100%", fontSize: 12, background: BG, border: "1px solid " + BORDER, borderRadius: 5, padding: "6px 8px", color: TEXT, marginBottom: 8 }}>
                  <option value="">Escolha um layout...</option>
                  {presets.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={() => applyBulkLayout(activeGroup.id)} style={{ width: "100%", fontSize: 12, fontWeight: 600, background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", cursor: "pointer" }}>
                  Aplicar a {activeGroup.screen_ids?.length ?? 0} tela(s)
                </button>
                {message && <div style={{ fontSize: 11, marginTop: 8, color: TEXT2 }}>{message}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Central de Controle · Rede ao Vivo (18/08/2026) ──────────────────────────
// Inspirada na tela "Central de Controle" do protótipo Figma Make, mas só com
// dado real: status vem de players.last_ping (mesma regra de online/idle/
// offline já usada em /api/admin/network-map), sem contador de audiência,
// receita por tela ou nomes de cliente fictícios como no protótipo — hoje só
// existe 1 cliente pagante real (BARBE332), então a lista fica curta mesmo.
// Cresce sozinha conforme mais telas entrarem na rede.
function TabCentralControle() {
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState({ total: 0, online: 0, idle: 0, offline: 0 })
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/network-map").then(r => r.json()).then(d => {
      setRows(d.players ?? [])
      setSummary(d.summary ?? { total: 0, online: 0, idle: 0, offline: 0 })
    }).catch(() => { setRows([]) }).finally(() => setLoading(false))
  }
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [])

  const statusColor = (s: string) => s === "online" ? GREEN : s === "idle" ? AMBER : MUTED
  const statusLabel = (s: string) => s === "online" ? "Online" : s === "idle" ? "Ociosa" : "Offline"

  const timeAgo = (iso: string | null) => {
    if (!iso) return "nunca"
    const diffMs = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diffMs / 60000)
    if (min < 1) return "agora"
    if (min < 60) return `${min}min atrás`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h atrás`
    return `${Math.floor(h / 24)}d atrás`
  }

  if (loading) return <div style={{ color: TEXT2, fontSize: 13, padding: "40px 0", textAlign: "center" }}>Carregando rede…</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Central de Controle · Rede ao Vivo</div>
          <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>Status real das telas conectadas — atualiza a cada 30s</div>
        </div>
        <button onClick={load} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: TEXT2, cursor: "pointer" }}>↻ Atualizar</button>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="Total de telas" value={summary.total} />
        <KpiCard label="Online"  value={summary.online}  color={GREEN} />
        <KpiCard label="Ociosas" value={summary.idle}    color={AMBER} />
        <KpiCard label="Offline" value={summary.offline} color={MUTED} />
      </div>

      {rows.length === 0 ? (
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
          <div style={{ fontSize: 14, color: TEXT, fontWeight: 600, marginBottom: 6 }}>Nenhuma tela com localização cadastrada ainda</div>
          <div style={{ fontSize: 12, color: TEXT2 }}>Assim que uma tela tiver latitude/longitude e enviar heartbeat, ela aparece aqui.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {rows.map((p: any) => (
            <div key={p.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.client_name ?? p.name ?? "Tela sem cliente"}</div>
                  <div style={{ fontSize: 11, color: TEXT2, marginTop: 2 }}>{p.location ?? "Localização não informada"}</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: statusColor(p.status) + "22", color: statusColor(p.status), border: "1px solid " + statusColor(p.status) + "44", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(p.status) }} />
                  {statusLabel(p.status)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {p.client_code && <span style={{ fontSize: 10, background: BORDER, color: TEXT2, padding: "2px 8px", borderRadius: 10 }}>{p.client_code}</span>}
                {p.platform && <span style={{ fontSize: 10, background: BORDER, color: TEXT2, padding: "2px 8px", borderRadius: 10 }}>{p.platform}</span>}
                {p.device_type && <span style={{ fontSize: 10, background: BORDER, color: TEXT2, padding: "2px 8px", borderRadius: 10 }}>{p.device_type}</span>}
              </div>
              <div style={{ fontSize: 11, color: TEXT2, marginTop: 10, borderTop: "1px solid " + BORDER, paddingTop: 8 }}>
                Último sinal: {timeAgo(p.last_ping)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Templates de tela (Fase 3b) — widgets de clima/bolsa/notícias ──
function TabTemplates({ data }: { data: any }) {
  const { clients } = data
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientCode, setClientCode] = useState("")
  const [templateKey, setTemplateKey] = useState("fullscreen")
  const [transitionEffect, setTransitionEffect] = useState("fade")
  const [widgetLayoutMode, setWidgetLayoutMode] = useState("fixed")
  // Fase 43 (21/08/2026): onde o painel aparece — Modelo 1 (faixa
  // inferior), Modelo 2 (lateral direita, padrão de sempre) ou Modelo 3
  // (lateral esquerda).
  const [widgetPosition, setWidgetPosition] = useState("lateral_right")
  const [locationName, setLocationName] = useState("São Paulo, SP")
  const [locationLat, setLocationLat] = useState("-23.5505")
  const [locationLon, setLocationLon] = useState("-46.6333")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [clientSettings, setClientSettings] = useState<any>(null)
  const [brandColor, setBrandColor] = useState("#3B82F6")
  const [savingBrand, setSavingBrand] = useState(false)
  const [brandMsg, setBrandMsg] = useState("")
  // Fase 45 (16/08/2026): selo "TV 3.0 Ready" — flag declarada por
  // cliente, ver docs/dtv-ready-mvp-plano.md. NÃO é detecção automática
  // de hardware; é o instalador confirmando que há um receptor/conversor
  // DTV+ conectado àquela tela.
  const [dtvReady, setDtvReady] = useState(false)
  const [savingDtv, setSavingDtv] = useState(false)
  const [dtvMsg, setDtvMsg] = useState("")

  useEffect(() => {
    if (!clientCode) { setClientSettings(null); return }
    fetch(`/api/client/settings/${clientCode}`)
      .then(r => r.json())
      .then(d => {
        setClientSettings(d)
        setBrandColor(d.primary_color || "#3B82F6")
      })
      .catch(() => setClientSettings(null))
  }, [clientCode])

  useEffect(() => {
    if (!clientCode) { setDtvReady(false); setDtvMsg(""); return }
    fetch(`/api/admin/feature-flags?client_code=${encodeURIComponent(clientCode)}`)
      .then(r => r.json())
      .then(d => {
        const flag = (d.items ?? []).find((i: any) => i.flag_key === "dtv_ready")
        setDtvReady(!!flag?.enabled)
      })
      .catch(() => setDtvReady(false))
  }, [clientCode])

  const saveDtvReady = async (next: boolean) => {
    if (!clientCode) return
    setSavingDtv(true); setDtvMsg("")
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_code: clientCode, flag_key: "dtv_ready", enabled: next }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao salvar")
      setDtvReady(next)
      setDtvMsg(next ? "✅ Selo TV 3.0 Ready ativado" : "Selo desativado")
    } catch (err: any) {
      setDtvMsg("⚠️ " + (err.message || "Erro ao salvar"))
    }
    setSavingDtv(false)
  }

  const saveBrandColor = async () => {
    if (!clientCode || !clientSettings) return
    setSavingBrand(true); setBrandMsg("")
    try {
      const res = await fetch(`/api/client/settings/${clientCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientSettings, primary_color: brandColor }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao salvar")
      setBrandMsg("✅ Cor da marca salva!")
    } catch (err: any) {
      setBrandMsg("⚠️ " + (err.message || "Erro ao salvar"))
    }
    setSavingBrand(false)
  }

  const load = () => {
    setLoading(true)
    fetch("/api/admin/screen-templates")
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!clientCode) { setError("Escolha um cliente"); return }
    setError(""); setSaving(true)
    try {
      const res = await fetch("/api/admin/screen-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_code: clientCode,
          template_key: templateKey,
          transition_effect: transitionEffect,
          widget_layout_mode: widgetLayoutMode,
          widget_position: widgetPosition,
          location_name: locationName,
          location_lat: Number(locationLat),
          location_lon: Number(locationLon),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Erro ao salvar")
      load()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar")
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>🖼️ Templates de Tela</div>
      </div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 20 }}>
        Escolha entre tela cheia normal ou o template "magazine", que mostra clima, bolsa (B3) e notícias
        numa faixa lateral fixa, ao lado do conteúdo normal.
      </div>

      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 16, color: TEXT }}>Configurar cliente</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Cliente</label>
          <select value={clientCode} onChange={e => setClientCode(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
            <option value="">Selecione...</option>
            {clients?.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>

        {clientCode && clientSettings && (
          <div style={{ marginBottom: 20, padding: 14, background: BG, borderRadius: 8, border: "1px solid " + BORDER }}>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 8 }}>
              🎨 Cor da marca — o sistema deriva toda a paleta de destaque da tela a partir dela
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: 44, height: 34, borderRadius: 6, border: "1px solid " + BORDER, background: "transparent", cursor: "pointer" }} />
              <span style={{ fontSize: 12, color: TEXT2, fontFamily: "monospace" }}>{brandColor.toUpperCase()}</span>
              <button onClick={saveBrandColor} disabled={savingBrand} style={{ marginLeft: "auto", background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: savingBrand ? 0.6 : 1 }}>
                {savingBrand ? "Salvando..." : "Salvar cor"}
              </button>
            </div>
            {brandMsg && <div style={{ fontSize: 11, marginTop: 8 }}>{brandMsg}</div>}
          </div>
        )}

        {clientCode && (
          <div style={{ marginBottom: 20, padding: 14, background: BG, borderRadius: 8, border: "1px solid " + BORDER }}>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 8 }}>
              📡 Selo "TV 3.0 Ready" (Fase 45) — declaração de que há um receptor/conversor DTV+ conectado a essa tela, não detecção automática de hardware
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => saveDtvReady(!dtvReady)}
                disabled={savingDtv}
                style={{
                  background: dtvReady ? BLUE : BG, color: dtvReady ? "#fff" : TEXT2,
                  border: "1px solid " + (dtvReady ? BLUE : BORDER), borderRadius: 6,
                  padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  opacity: savingDtv ? 0.6 : 1,
                }}
              >
                {savingDtv ? "Salvando..." : dtvReady ? "✅ Ativado" : "Ativar selo"}
              </button>
            </div>
            {dtvMsg && <div style={{ fontSize: 11, marginTop: 8 }}>{dtvMsg}</div>}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Template</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setTemplateKey("fullscreen")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (templateKey === "fullscreen" ? BLUE : BORDER),
              background: templateKey === "fullscreen" ? BLUE : BG,
              color: templateKey === "fullscreen" ? "#fff" : TEXT2, cursor: "pointer",
            }}>🖥️ Tela cheia (padrão)</button>
            <button type="button" onClick={() => setTemplateKey("magazine")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (templateKey === "magazine" ? BLUE : BORDER),
              background: templateKey === "magazine" ? BLUE : BG,
              color: templateKey === "magazine" ? "#fff" : TEXT2, cursor: "pointer",
            }}>🖼️ Magazine (clima+bolsa+notícias)</button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Efeito de transição entre slides</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "fade", label: "🌫️ Fade" },
              { key: "cortina", label: "🎬 Cortina" },
              { key: "deslizar", label: "➡️ Deslizar" },
              { key: "none", label: "✂️ Corte seco" },
            ].map(opt => (
              <button key={opt.key} type="button" onClick={() => setTransitionEffect(opt.key)} style={{
                flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
                border: "1px solid " + (transitionEffect === opt.key ? BLUE : BORDER),
                background: transitionEffect === opt.key ? BLUE : BG,
                color: transitionEffect === opt.key ? "#fff" : TEXT2, cursor: "pointer",
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {templateKey === "magazine" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>
              Modo dos widgets (Fase 39)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "fixed", label: "📌 Fixos (4 empilhados)" },
                { key: "revezando", label: "🔄 Revezando em pares" },
                { key: "compacto", label: "➖ Compacto (barra + ticker)" },
                { key: "painel_completo", label: "🗂️ Painel completo (8 fontes)" },
              ].map(opt => (
                <button key={opt.key} type="button" onClick={() => setWidgetLayoutMode(opt.key)} style={{
                  flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
                  border: "1px solid " + (widgetLayoutMode === opt.key ? BLUE : BORDER),
                  background: widgetLayoutMode === opt.key ? BLUE : BG,
                  color: widgetLayoutMode === opt.key ? "#fff" : TEXT2, cursor: "pointer",
                }}>{opt.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
              Revezando: hora↔clima num card, bolsa↔economia noutro. Painel completo (Fase 43): relógio+clima e
              logo fixos nas pontas, card central revezando bolsa/câmbio/indicadores/notícias/economia/qualidade
              do ar/enquete/loteria.
            </div>
          </div>
        )}

        {templateKey === "magazine" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>
              Posição do painel (Fase 43)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "bottom", label: "⬇️ Modelo 1 — Faixa inferior" },
                { key: "lateral_right", label: "➡️ Modelo 2 — Lateral direita" },
                { key: "lateral_left", label: "⬅️ Modelo 3 — Lateral esquerda" },
              ].map(opt => (
                <button key={opt.key} type="button" onClick={() => setWidgetPosition(opt.key)} style={{
                  flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
                  border: "1px solid " + (widgetPosition === opt.key ? BLUE : BORDER),
                  background: widgetPosition === opt.key ? BLUE : BG,
                  color: widgetPosition === opt.key ? "#fff" : TEXT2, cursor: "pointer",
                }}>{opt.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
              Lateral direita é a posição de sempre — trocar não afeta clientes já configurados a menos que você salve essa mudança pra eles.
            </div>
          </div>
        )}

        {templateKey === "magazine" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Localização (nome)</label>
              <input value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Latitude</label>
              <input value={locationLat} onChange={e => setLocationLat(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Longitude</label>
              <input value={locationLon} onChange={e => setLocationLon(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
            </div>
          </div>
        )}
        {templateKey !== "custom" && (
          <>
            <div style={{ fontSize: 11, color: TEXT2, marginBottom: 12 }}>
              Bolsa: mostra sempre PETR4, VALE3, MGLU3 e ITUB4 (as únicas ações liberadas sem custo). Notícias: G1 geral.
            </div>

            {error && <div style={{ color: RED, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
            <button onClick={save} disabled={saving} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
          </>
        )}
      </div>

      <div style={{ fontWeight: 600, marginBottom: 12, color: TEXT }}>Clientes configurados</div>
      {loading ? <div style={{ color: TEXT2, fontSize: 13 }}>Carregando...</div> : items.length === 0 ? (
        <div style={{ color: TEXT2, fontSize: 13 }}>Nenhum cliente com template customizado ainda — todos estão em "Tela cheia" (padrão).</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((it: any) => (
            <div key={it.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 600, color: TEXT }}>{it.client_code}</span>
                <span style={{ fontSize: 12, color: TEXT2, marginLeft: 10 }}>
                  {it.template_key === "magazine" ? `🖼️ Magazine · ${it.location_name}` : "🖥️ Tela cheia"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Conteúdo Institucional (DOOHPLAY) — exibido em TODAS as telas da rede ──
function TabInstitucional() {
  const DAYS = [
    { code: "mon", label: "Seg" }, { code: "tue", label: "Ter" }, { code: "wed", label: "Qua" },
    { code: "thu", label: "Qui" }, { code: "fri", label: "Sex" }, { code: "sat", label: "Sáb" }, { code: "sun", label: "Dom" },
  ]
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState("")
  const [duration, setDuration] = useState("15")
  const [position, setPosition] = useState("0")
  const [file, setFile] = useState<File | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(DAYS.map(d => d.code)) // padrão: todos os dias
  const [displayFormat, setDisplayFormat] = useState("fullscreen")
  const [error, setError] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Fase 9 — layout multi-zona e YouTube como tipo de slide, mais sequência
  const [contentType, setContentType] = useState<"media" | "layout" | "youtube">("media")
  const [layoutTemplateId, setLayoutTemplateId] = useState("")
  const [layoutPresets, setLayoutPresets] = useState<any[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [sequenceGroup, setSequenceGroup] = useState("")
  // Canal DOOHPLAY (12/07/2026): "" = institucional genérico (5%, todas as
  // telas, comportamento de sempre). Com um segmento escolhido = vira
  // conteúdo do canal daquele segmento (20%, só telas do business_type
  // correspondente).
  const [segmentId, setSegmentId] = useState("")
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([])
  const [zoneFiles, setZoneFiles] = useState<Record<string, File>>({})
  // Fase 9d — editor completo (arrastar/redimensionar/escolher tipo de
  // bloco) em vez de só um preset fixo. customZones fica vazio até o admin
  // clicar "Usar esse layout" no editor.
  const [customZones, setCustomZones] = useState<any[]>([])
  const [customOrientation, setCustomOrientation] = useState<"horizontal" | "vertical">("horizontal")

  useEffect(() => {
    fetch("/api/admin/layout-templates").then(r => r.json()).then(d => setLayoutPresets(d.presets ?? [])).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    fetch("/api/admin/institutional-media")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setSegments(d.segments ?? []) })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggleDay = (code: string) => {
    setDaysOfWeek(prev => prev.includes(code) ? prev.filter(d => d !== code) : [...prev, code])
  }

  const upload = async () => {
    if (contentType === "media" && !file) { setError("Escolha um arquivo"); return }
    if (contentType === "layout" && customZones.length === 0) { setError("Desenhe o layout e clique em \"Usar esse layout\""); return }
    if (contentType === "youtube" && !youtubeUrl.trim()) { setError("Cole a URL do vídeo do YouTube"); return }
    if (!name.trim()) { setError("Dê um nome pra essa peça"); return }
    if (!startDate || !endDate) { setError("Data de início e fim são obrigatórias"); return }
    if (startDate > endDate) { setError("Data de início não pode ser depois da data de fim"); return }
    if (daysOfWeek.length === 0) { setError("Selecione pelo menos um dia da semana"); return }
    setError(""); setUploading(true)
    try {
      // Layout desenhado no editor completo (Fase 9d) — cria o registro
      // avulso primeiro pra ter um id, antes de cadastrar o item institucional.
      let resolvedLayoutId = layoutTemplateId
      if (contentType === "layout") {
        const layoutRes = await fetch("/api/admin/layout-templates/custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name || "Layout personalizado", orientation: customOrientation, zones: customZones }),
        })
        const layoutData = await layoutRes.json()
        if (!layoutRes.ok) throw new Error(layoutData.error || "Erro ao criar o layout")
        resolvedLayoutId = layoutData.id
      }

      const form = new FormData()
      form.append("content_type", contentType)
      if (contentType === "media" && file) form.append("file", file)
      if (contentType === "layout") form.append("layout_template_id", resolvedLayoutId)
      if (contentType === "layout") {
        Object.entries(zoneFiles).forEach(([zoneId, f]) => {
          if (f) form.append(`zone_file_${zoneId}`, f)
        })
      }
      if (contentType === "youtube") form.append("youtube_url", youtubeUrl.trim())
      form.append("name", name)
      form.append("duration", duration)
      form.append("position", position)
      form.append("start_date", startDate)
      form.append("end_date", endDate)
      if (startTime) form.append("start_time", startTime)
      if (endTime) form.append("end_time", endTime)
      if (daysOfWeek.length < 7) form.append("days_of_week", daysOfWeek.join(","))
      form.append("display_format", displayFormat)
      if (sequenceGroup.trim()) form.append("sequence_group", sequenceGroup.trim())
      if (segmentId) form.append("segment_id", segmentId)
      const res = await fetch("/api/admin/institutional-media", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar")
      setName(""); setFile(null); setStartDate(""); setEndDate(""); setStartTime(""); setEndTime("")
      setDaysOfWeek(DAYS.map(d => d.code)); setDisplayFormat("fullscreen"); setZoneFiles({})
      setContentType("media"); setLayoutTemplateId(""); setYoutubeUrl(""); setSequenceGroup("")
      setSegmentId("")
      setCustomZones([]); setCustomOrientation("horizontal")
      load()
    } catch (err: any) {
      setError(err.message || "Erro ao enviar")
    }
    setUploading(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id)
    try {
      await fetch(`/api/admin/institutional-media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      })
      load()
    } catch {}
    setTogglingId(null)
  }

  const remove = async (id: string, itemName: string) => {
    if (!confirm(`Remover "${itemName}" definitivamente? Para de aparecer em TODAS as telas da rede.`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/institutional-media/${id}`, { method: "DELETE" })
      load()
    } catch {}
    setDeletingId(null)
  }

  const scheduleSummary = (it: any) => {
    const parts: string[] = []
    if (it.start_date && it.end_date) {
      const fmt = (d: string) => d.slice(0, 10).split("-").reverse().join("/")
      parts.push(`${fmt(it.start_date)}–${fmt(it.end_date)}`)
    }
    if (it.days_of_week && it.days_of_week.length > 0 && it.days_of_week.length < 7) {
      parts.push(DAYS.filter(d => it.days_of_week.includes(d.code)).map(d => d.label).join(","))
    }
    if (it.start_time && it.end_time) {
      parts.push(`${it.start_time.slice(0,5)}-${it.end_time.slice(0,5)}`)
    }
    return parts.join(" · ") || "Sempre ativo"
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>🏢 Conteúdo Institucional</div>
        <div style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>
          O que o DOOHPLAY mostra nas telas — entra automaticamente na rotação de TODOS os clientes (≈5% do tempo no sorteio ponderado; peças com segmento definido entram como "canal" a ≈20% só nas telas do segmento). Use com moderação.
        </div>
      </div>

      <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 14 }}>Adicionar nova peça institucional</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Duração</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
              {[10, 15, 20, 30, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d < 60 ? `${d}s` : `${d / 60}min`}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Posição (ordem)</label>
            <input type="number" value={position} onChange={e => setPosition(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: TEXT2, marginTop: -6, marginBottom: 12 }}>
          Vídeos institucionais de até 3min são permitidos (exceção à regra geral de duração — este conteúdo ocupa só ≈5% do sorteio ponderado (≈20% se tiver segmento definido), então o impacto em inventário é menor).
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Data de início *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Data de fim *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Dias da semana</label>
          <div style={{ display: "flex", gap: 4 }}>
            {DAYS.map(d => (
              <button key={d.code} type="button" onClick={() => toggleDay(d.code)} style={{
                flex: 1, fontSize: 11, fontWeight: 600, padding: "6px 0", borderRadius: 5,
                border: "1px solid " + (daysOfWeek.includes(d.code) ? BLUE : BORDER),
                background: daysOfWeek.includes(d.code) ? BLUE : BG,
                color: daysOfWeek.includes(d.code) ? "#fff" : TEXT2, cursor: "pointer",
              }}>{d.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Horário início (opcional)</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Horário fim (opcional)</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: TEXT2, marginTop: -6, marginBottom: 12 }}>
          Deixe horário em branco pra exibir o dia inteiro. Datas são obrigatórias — a peça só entra na rotação dentro da janela configurada.
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Formato de exibição</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setDisplayFormat("fullscreen")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (displayFormat === "fullscreen" ? BLUE : BORDER),
              background: displayFormat === "fullscreen" ? BLUE : BG,
              color: displayFormat === "fullscreen" ? "#fff" : TEXT2, cursor: "pointer",
            }}>🖥️ Tela cheia</button>
            <button type="button" onClick={() => setDisplayFormat("shrink_lateral")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (displayFormat === "shrink_lateral" ? BLUE : BORDER),
              background: displayFormat === "shrink_lateral" ? BLUE : BG,
              color: displayFormat === "shrink_lateral" ? "#fff" : TEXT2, cursor: "pointer",
            }}>↔️ Encolhe lateral</button>
          </div>
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
            "Encolhe lateral": a tela principal encolhe e essa peça aparece do lado, sem cobrir o conteúdo em exibição.
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Tipo de conteúdo</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setContentType("media")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (contentType === "media" ? BLUE : BORDER),
              background: contentType === "media" ? BLUE : BG,
              color: contentType === "media" ? "#fff" : TEXT2, cursor: "pointer",
            }}>🖼️ Imagem/vídeo</button>
            <button type="button" onClick={() => setContentType("layout")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (contentType === "layout" ? BLUE : BORDER),
              background: contentType === "layout" ? BLUE : BG,
              color: contentType === "layout" ? "#fff" : TEXT2, cursor: "pointer",
            }}>🗂️ Layout multi-zona</button>
            <button type="button" onClick={() => setContentType("youtube")} style={{
              flex: 1, fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 6,
              border: "1px solid " + (contentType === "youtube" ? BLUE : BORDER),
              background: contentType === "youtube" ? BLUE : BG,
              color: contentType === "youtube" ? "#fff" : TEXT2, cursor: "pointer",
            }}>▶️ YouTube</button>
          </div>
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
            Esses 3 tipos entram misturados na mesma rotação, como slides de uma programação — não são mais um modo fixo de tela.
          </div>
        </div>

        {contentType === "layout" && (
          <div style={{ marginBottom: 12 }}>
            <LayoutEditor
              onFinalize={(zones, orientation) => { setCustomZones(zones); setCustomOrientation(orientation); setZoneFiles({}) }}
            />

            {customZones.length > 0 && (() => {
              const contentZones = customZones.filter((z: any) => z.content_type === "main_rotation" || z.content_type === "ad_only")
              if (contentZones.length === 0) return null
              return (
                <div style={{ marginTop: 10, padding: 12, background: BG, borderRadius: 8, border: "1px solid " + BORDER }}>
                  <div style={{ fontSize: 11, color: TEXT2, marginBottom: 10 }}>
                    Escolha o que entra em cada bloco de conteúdo desse layout. Deixar em branco = mistura sozinho com o resto (sorteio automático).
                  </div>
                  {contentZones.map((z: any) => (
                    <div key={z.id} style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 3 }}>
                        Bloco "{z.content_type === "main_rotation" ? "Principal" : "Só anúncio"}" ({z.w}%×{z.h}%)
                      </label>
                      <input
                        type="file" accept="image/*,video/*"
                        onChange={e => setZoneFiles(prev => ({ ...prev, [z.id]: e.target.files?.[0] as File }))}
                        style={{ fontSize: 12, color: TEXT2 }}
                      />
                      {zoneFiles[z.id] && <span style={{ fontSize: 11, color: "#10B981", marginLeft: 8 }}>✓ {zoneFiles[z.id].name}</span>}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {contentType === "youtube" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>URL do vídeo</label>
            <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
            <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
              ⚠️ Precisa de internet no aparelho pra funcionar (diferente do resto, que roda de um cache local). Os controles do YouTube aparecem — é exigência deles, não removemos.
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Grupo de sequência (opcional)</label>
          <input value={sequenceGroup} onChange={e => setSequenceGroup(e.target.value)} placeholder="Ex: bloco-manha" style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
            Itens com o mesmo nome de grupo tocam em bloco, um atrás do outro, quando a vez do institucional chegar — sensação de "canal DOOHPLAY" em vez de peça solta.
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Canal (opcional)</label>
          <select value={segmentId} onChange={e => setSegmentId(e.target.value)} style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }}>
            <option value="">Institucional genérico — todas as telas (5% do tempo)</option>
            {segments.map(seg => (
              <option key={seg.id} value={seg.id}>{seg.name}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: TEXT2, marginTop: 4 }}>
            Sem escolher um canal, a peça é institucional genérico e aparece em toda tela da rede (5% do tempo). Escolhendo um canal, ela só aparece nas telas do tipo de negócio daquele canal (20% do tempo).
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: TEXT2, display: "block", marginBottom: 4 }}>Nome da peça</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas-vindas DOOHPLAY" style={{ width: "100%", background: BG, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 10px", color: TEXT, fontSize: 13 }} />
        </div>
        {contentType === "media" && (
          <div style={{ marginBottom: 12 }}>
            <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, color: TEXT2 }} />
          </div>
        )}
        {error && <div style={{ fontSize: 12, color: RED, marginBottom: 10 }}>⚠️ {error}</div>}
        <button onClick={upload} disabled={uploading} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>
          {uploading ? "Enviando…" : "Adicionar à rotação institucional"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: TEXT2 }}>Carregando…</div>
      ) : items.length === 0 ? (
        <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, padding: 20, fontSize: 13, color: TEXT2 }}>
          Nenhuma peça institucional cadastrada ainda — o slot de 10% fica vazio até você adicionar a primeira.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {items.map((it: any) => (
            <div key={it.id} style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden", opacity: it.active ? 1 : 0.5 }}>
              <div style={{ height: 90, background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {it.type === "layout"
                  ? <span style={{ fontSize: 28 }}>🗂️</span>
                  : it.type === "youtube"
                  ? <span style={{ fontSize: 28 }}>▶️</span>
                  : it.type === "video"
                  ? <video src={it.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                  : <img src={it.url} alt={it.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                <div style={{ fontSize: 10, color: TEXT2, marginBottom: 2 }}>pos. {it.position} · {it.duration}s{it.sequence_group ? ` · 🔗 ${it.sequence_group}` : ""}{it.segment_id ? ` · 📺 ${segments.find(s => s.id === it.segment_id)?.name ?? "canal"}` : ""}</div>
                <div style={{ fontSize: 10, color: TEXT2, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📅 {scheduleSummary(it)}</div>
                {it.display_format === "shrink_lateral" && (
                  <div style={{ fontSize: 10, color: BLUE, marginBottom: 6, fontWeight: 600 }}>↔️ Encolhe lateral</div>
                )}
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => toggleActive(it.id, it.active)}
                    disabled={togglingId === it.id}
                    style={{ flex: 1, fontSize: 10, fontWeight: 600, padding: "4px", borderRadius: 5, border: "1px solid " + BORDER, background: it.active ? RED + "10" : GREEN + "10", color: it.active ? RED : GREEN, cursor: togglingId === it.id ? "not-allowed" : "pointer" }}
                  >
                    {togglingId === it.id ? "…" : it.active ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    onClick={() => remove(it.id, it.name)}
                    disabled={deletingId === it.id}
                    style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "1px solid " + BORDER, background: "transparent", color: TEXT2, cursor: deletingId === it.id ? "not-allowed" : "pointer" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabRede({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const items = data.networkMedia ?? []
  const pending = items.filter((m: any) => m.status === "pending_review")
  const others  = items.filter((m: any) => m.status !== "pending_review")

  const handle = async (id: string, status: "approved" | "rejected") => {
    setLoading(id)
    try {
      await fetch("/api/admin/network-media/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      onRefresh()
    } catch {}
    setLoading(null)
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
        Mídia do Clube de Telas <span style={{ fontSize: 13, color: TEXT2, fontWeight: 400 }}>({pending.length} pendente{pending.length !== 1 ? "s" : ""})</span>
      </div>
      <div style={{ fontSize: 13, color: TEXT2, marginBottom: 20 }}>
        Ao aprovar, a mídia é distribuída automaticamente para todos os parceiros já aceitos do dono.
      </div>
      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", background: SURFACE, borderRadius: 12, border: "1px dashed " + BORDER, color: TEXT2, marginBottom: 24 }}>
          Nenhuma mídia de rede pendente. ✅
        </div>
      )}
      {pending.map((m: any) => (
        <div key={m.id} style={{ background: SURFACE, border: "1px solid " + AMBER + "44", borderRadius: 12, padding: "16px 20px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <MediaPreview url={m.url} type={m.type} name={m.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: TEXT, marginBottom: 4, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 2 }}>{m.owner_name ?? m.owner_code} · #{m.owner_code}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{m.partner_count ?? 0} parceiro(s) aceito(s) vão receber essa mídia se aprovada</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => handle(m.id, "approved")} disabled={loading === m.id} style={{ background: GREEN + "22", color: GREEN, border: "1px solid " + GREEN + "44", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {loading === m.id ? "…" : "✓ Aprovar"}
              </button>
              <button onClick={() => handle(m.id, "rejected")} disabled={loading === m.id} style={{ background: RED + "22", color: RED, border: "1px solid " + RED + "44", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✕ Rejeitar
              </button>
            </div>
          </div>
        </div>
      ))}
      {others.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 12, marginTop: 8 }}>Histórico</div>
          <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + BORDER }}>
                  {["Mídia","Dono","Tipo","Status","Data"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((m: any, i: number) => (
                  <tr key={m.id} style={{ borderBottom: i < others.length - 1 ? "1px solid " + BORDER : "none" }}>
                    <td style={{ padding: "10px 16px", color: TEXT, fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{m.owner_name ?? m.owner_code}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{m.type === "video" ? "🎬 Vídeo" : "🖼️ Imagem"}</td>
                    <td style={{ padding: "10px 16px" }}><Badge label={m.status} color={m.status === "approved" ? GREEN : m.status === "rejected" ? RED : AMBER} /></td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{fmt(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function TabMidias({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [loading, setLoading]   = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason]     = useState("")
  // Fase 16 (12/07/2026): tags de brand-safety escolhidas por item, antes
  // de aprovar. Taxonomia fixa — mesma lista usada no dashboard do
  // cliente (app/api/client/ad-tag-preferences/[code]/route.ts).
  const AD_TAGS: { id: string; label: string }[] = [
    { id: "bebida_alcoolica", label: "Bebida alcoólica" },
    { id: "tabaco",           label: "Tabaco" },
    { id: "apostas",          label: "Apostas / jogos de azar" },
    { id: "conteudo_adulto",  label: "Conteúdo adulto/sensível" },
    { id: "politica",         label: "Conteúdo político" },
  ]
  const [pendingTags, setPendingTags] = useState<Record<string, string[]>>({})
  const toggleTag = (mediaId: string, tagId: string) => {
    setPendingTags(prev => {
      const current = prev[mediaId] ?? []
      const next = current.includes(tagId) ? current.filter(t => t !== tagId) : [...current, tagId]
      return { ...prev, [mediaId]: next }
    })
  }
  // Fase 33 (20/07/2026): formato de exibição escolhido por item, antes de
  // aprovar. Feedback direto de cliente prospectado pedindo mais posições
  // de anúncio além de tela cheia (lateral/faixa inferior/flutuante).
  const DISPLAY_FORMATS: { id: string; label: string }[] = [
    { id: "fullscreen", label: "Tela cheia" },
    { id: "shrink_lateral", label: "Lateral (reduz tela principal)" },
    { id: "banner_bottom", label: "Faixa inferior (reduz tela principal)" },
    { id: "floating", label: "Flutuante (não interrompe a programação)" },
  ]
  const [pendingFormat, setPendingFormat] = useState<Record<string, string>>({})
  const medias  = data.medias ?? []
  const pending = medias.filter((m: any) => m.status === "pending")
  const others  = medias.filter((m: any) => m.status !== "pending")

  const handle = async (id: string, status: "approved" | "rejected", r?: string) => {
    setLoading(id)
    try {
      await fetch("/api/admin/media/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: r, tags: pendingTags[id] ?? [], display_format: pendingFormat[id] ?? "fullscreen" }),
      })
      setRejectId(null); setReason(""); onRefresh()
    } catch {}
    setLoading(null)
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 20 }}>
        Mídias <span style={{ fontSize: 13, color: TEXT2, fontWeight: 400 }}>({pending.length} pendente{pending.length !== 1 ? "s" : ""})</span>
      </div>
      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", background: SURFACE, borderRadius: 12, border: "1px dashed " + BORDER, color: TEXT2, marginBottom: 24 }}>
          Nenhuma mídia pendente. ✅
        </div>
      )}
      {pending.map((m: any) => (
        <div key={m.id} style={{ background: SURFACE, border: "1px solid " + AMBER + "44", borderRadius: 12, padding: "16px 20px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <MediaPreview url={m.url} type={m.type} name={m.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: TEXT, marginBottom: 4, fontSize: 14 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: TEXT2, marginBottom: 2 }}>{m.advertiser_name} · {m.campaign_name}</div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{fmt(m.createdAt)} · {m.type === "video" ? "🎬 Vídeo" : "🖼️ Imagem"}</div>
              {m.url && <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: BLUE, textDecoration: "none" }}>↗ Abrir arquivo original</a>}
              <div style={{ fontSize: 10, color: TEXT2, marginTop: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tags de brand-safety (opcional)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {AD_TAGS.map(tag => {
                  const active = (pendingTags[m.id] ?? []).includes(tag.id)
                  return (
                    <button key={tag.id} onClick={() => toggleTag(m.id, tag.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid " + (active ? AMBER : BORDER), background: active ? AMBER + "22" : "transparent", color: active ? AMBER : TEXT2, cursor: "pointer" }}>
                      {tag.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: 10, color: TEXT2, marginTop: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Formato de exibição</div>
              <select
                value={pendingFormat[m.id] ?? "fullscreen"}
                onChange={e => setPendingFormat(prev => ({ ...prev, [m.id]: e.target.value }))}
                style={{ fontSize: 12, padding: "6px 10px", borderRadius: 7, border: "1px solid " + BORDER, background: BG, color: TEXT, outline: "none" }}
              >
                {DISPLAY_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => handle(m.id, "approved")} disabled={loading === m.id} style={{ background: GREEN + "22", color: GREEN, border: "1px solid " + GREEN + "44", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {loading === m.id ? "…" : "✓ Aprovar"}
              </button>
              <button onClick={() => setRejectId(rejectId === m.id ? null : m.id)} disabled={loading === m.id} style={{ background: RED + "22", color: RED, border: "1px solid " + RED + "44", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✕ Rejeitar
              </button>
            </div>
          </div>
          {rejectId === m.id && (
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo da rejeição…" style={{ flex: 1, background: BG, border: "1px solid " + BORDER, borderRadius: 7, padding: "8px 12px", color: TEXT, fontSize: 13, outline: "none" }} />
              <button onClick={() => handle(m.id, "rejected", reason)} style={{ background: RED, color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Confirmar</button>
              <button onClick={() => { setRejectId(null); setReason("") }} style={{ background: "transparent", color: TEXT2, border: "1px solid " + BORDER, borderRadius: 7, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            </div>
          )}
        </div>
      ))}
      {others.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT2, marginBottom: 12, marginTop: 8 }}>Histórico</div>
          <div style={{ background: SURFACE, border: "1px solid " + BORDER, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid " + BORDER }}>
                  {["Preview","Mídia","Anunciante","Campanha","Tipo","Status","Tags","Data"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((m: any, i: number) => (
                  <tr key={m.id} style={{ borderBottom: i < others.length - 1 ? "1px solid " + BORDER : "none" }}>
                    <td style={{ padding: "10px 16px" }}>
                      {m.url ? (
                        m.type === "video"
                          ? <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: 20, textDecoration: "none" }}>🎬</a>
                          : <a href={m.url} target="_blank" rel="noreferrer"><img src={m.url} alt={m.name} style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 6, display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} /></a>
                      ) : <span style={{ fontSize: 20 }}>{m.type === "video" ? "🎬" : "🖼️"}</span>}
                    </td>
                    <td style={{ padding: "10px 16px", color: TEXT, fontWeight: 500 }}>{m.name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{m.advertiser_name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{m.campaign_name}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{m.type === "video" ? "🎬 Vídeo" : "🖼️ Imagem"}</td>
                    <td style={{ padding: "10px 16px" }}><Badge label={m.status} color={m.status === "approved" ? GREEN : m.status === "rejected" ? RED : AMBER} /></td>
                    <td style={{ padding: "10px 16px", fontSize: 11, color: TEXT2 }}>{(m.content_tags ?? []).join(", ") || "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: TEXT2 }}>{fmt(m.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState("dashboard")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login")
    if (status === "authenticated")  load()
  }, [status])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }

  if (status === "loading" || loading || !data) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT2, fontFamily: "'Inter', system-ui, sans-serif" }}>
      Carregando…
    </div>
  )

  const pendingMedias = data.medias?.filter((m: any) => m.status === "pending").length ?? 0
  const pendingAlerts = data.duplicateAlerts?.filter((a: any) => !a.resolved).length ?? 0
  const pendingNetworkMedia = data.networkMedia?.filter((m: any) => m.status === "pending_review").length ?? 0

  const isSuperAdmin = (session?.user as any)?.role === "super_admin"

  const TABS = [
    { id: "dashboard",   label: "Dashboard",   icon: "📊" },
    { id: "diagnostico", label: "Diagnóstico", icon: "🔍" },
    { id: "clientes",    label: "Clientes",    icon: "👥", count: data.clients?.length },
    ...(isSuperAdmin ? [{ id: "assinaturas", label: "Assinaturas", icon: "💳", count: data.subscriptions?.length }] : []),
    { id: "anunciantes", label: "Anunciantes", icon: "📢", count: data.advertisers?.length },
    { id: "midias",      label: "Mídias",      icon: "🎬", count: pendingMedias, alert: pendingMedias > 0 },
    { id: "rede",        label: "Rede",        icon: "🤝", count: pendingNetworkMedia, alert: pendingNetworkMedia > 0 },
    { id: "exemplos",    label: "Exemplos",    icon: "📚" },
    { id: "institucional", label: "Institucional", icon: "🏢" },
    { id: "templates",   label: "Templates",   icon: "🖼️" },
    { id: "frota",       label: "Frota",       icon: "🖥️" },
    { id: "central",     label: "Central de Controle", icon: "📡" },
    { id: "enquetes",    label: "Enquetes",    icon: "🗳️" },
    { id: "alertas",     label: "Alertas",     icon: "🚨", count: pendingAlerts, alert: pendingAlerts > 0 },
    { id: "eventos",     label: "Eventos",     icon: "⚡" },
    ...(isSuperAdmin ? [{ id: "usuarios", label: "Usuários", icon: "🔐" }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input::placeholder { color: #4B5563; }`}</style>

      <div style={{ background: SURFACE, borderBottom: "1px solid " + BORDER, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: TEXT }}>DOOH</span><span style={{ color: BLUE }}>PLAY</span>
          </span>
          <span style={{ fontSize: 11, color: TEXT2, background: BORDER, padding: "2px 8px", borderRadius: 10, marginLeft: 4 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: TEXT2 }}>{session?.user?.email}</span>
          <Link href="/" style={{ fontSize: 12, color: TEXT2, textDecoration: "none" }}>← Site</Link>
          <button onClick={() => signOut({ callbackUrl: "/admin/login" })} style={{ fontSize: 12, color: RED, background: "transparent", border: "1px solid " + RED + "44", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </div>

      <div style={{ background: SURFACE, borderBottom: "1px solid " + BORDER, padding: "0 24px", display: "flex", gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "14px 18px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? BLUE : TEXT2, borderBottom: "2px solid " + (tab === t.id ? BLUE : "transparent"), display: "flex", alignItems: "center", gap: 6 }}>
            {t.icon} {t.label}
            {t.count !== undefined && (
              <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 10, background: (t as any).alert ? AMBER + "33" : BORDER, color: (t as any).alert ? AMBER : TEXT2, fontWeight: (t as any).alert ? 700 : 400 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "dashboard"   && <TabDashboard   data={data} />}
        {tab === "diagnostico" && <TabDiagnostico />}
        {tab === "clientes"    && <TabClientes    data={data} onRefresh={load} isSuperAdmin={isSuperAdmin} />}
        {tab === "assinaturas" && isSuperAdmin && <TabAssinaturas data={data} />}
        {tab === "anunciantes" && <TabAnunciantes data={data} isSuperAdmin={isSuperAdmin} onRefresh={load} />}
        {tab === "midias"      && <TabMidias      data={data} onRefresh={load} />}
        {tab === "rede"        && <TabRede        data={data} onRefresh={load} />}
        {tab === "exemplos"    && <TabExemplos />}
        {tab === "institucional" && <TabInstitucional />}
        {tab === "templates"    && <TabTemplates data={data} />}
        {tab === "frota"        && <TabFrota data={data} />}
        {tab === "central"      && <TabCentralControle />}
        {tab === "enquetes"     && <TabEnquetes data={data} />}
        {tab === "alertas"     && <TabAlertas     data={data} onRefresh={load} />}
        {tab === "eventos"     && <TabEventos     data={data} />}
        {tab === "usuarios" && isSuperAdmin && <TabUsuarios />}
      </div>
    </div>
  )
}
