"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef, use } from "react";
import DtvReadyBadge from "@/components/ui/DtvReadyBadge";

// ─── Paleta dark premium ─────────────────────────────────────────────────────
const C = {
  bg:        "#0B1020",
  surface:   "#111827",
  border:    "#1F2937",
  muted:     "#374151",
  text:      "#F9FAFB",
  textSub:   "#9CA3AF",
  primary:   "#3B82F6",
  primaryDim:"#1D4ED8",
  success:   "#10B981",
  warning:   "#F59E0B",
  danger:    "#EF4444",
  purple:    "#8B5CF6",
};

const fmt     = (n: any) => new Intl.NumberFormat("pt-BR").format(n ?? 0);
const brl     = (n: any) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:         { label: "Pendente",            color: C.warning },
  pending_payment: { label: "Aguardando pagamento", color: C.warning },
  active:          { label: "Ativo",                color: C.success },
  overdue:         { label: "Pagamento atrasado",   color: C.danger  },
  cancelled:       { label: "Cancelada",             color: C.muted   },
  paused:          { label: "Pausado",               color: C.textSub },
  finished:        { label: "Encerrado",             color: C.muted   },
  approved:        { label: "Aprovado",              color: C.success },
  rejected:        { label: "Rejeitado",             color: C.danger  },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#0B1020", border: `1px solid #1F2937`,
  borderRadius: 8, padding: "10px 14px",
  color: "#F9FAFB", fontSize: 14, outline: "none",
};

function Badge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: C.textSub };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: s.color + "22", color: s.color, border: `1px solid ${s.color}44`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: any; sub?: string; color?: string }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "20px 24px", flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? C.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Campanhas ───────────────────────────────────────────────────────────────
function TabCampanhas({ code, campaigns, onRefresh }: { code: string; campaigns: any[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", startDate: "", endDate: "", budget: "", screens: [] as string[],
  });

  const [screensList, setScreensList] = useState<{ id: string; city: string; name: string; business_type?: string; screen_size?: string; price_multiplier?: number; screen_orientation?: string; dtv_ready?: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/advertiser/screens")
      .then(r => r.json())
      .then(d => setScreensList(d.screens ?? []))
      .catch(() => setScreensList([]));
  }, []);

  const SCREENS = screensList;

  // Preço sugerido, baseado em benchmark de mercado (DOOH varejo de bairro
  // no Brasil) — R$10/dia como ancoragem pra tela "média" (multiplicador
  // 1.0), ajustado pelo multiplicador de tamanho de cada tela. É só
  // REFERÊNCIA — o anunciante continua definindo o orçamento livremente,
  // sem piso obrigatório ainda (decisão consciente, ver roadmap).
  const BASE_PRICE_PER_DAY = 10;
  const durationDays = form.startDate && form.endDate
    ? Math.max(1, Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1)
    : 0;
  // Pacotes por duração — desconto padrão do setor por compromisso mais
  // longo (mesma lógica de qualquer mídia tradicional: quanto mais tempo
  // contratado, menor o valor por dia).
  const durationDiscount = durationDays >= 90 ? 0.25 : durationDays >= 30 ? 0.15 : 0;
  const suggestedTotal = durationDays > 0 && form.screens.length > 0
    ? form.screens.reduce((sum, id) => {
        const sc = SCREENS.find(s => s.id === id);
        const mult = Number(sc?.price_multiplier ?? 1);
        return sum + BASE_PRICE_PER_DAY * mult * durationDays;
      }, 0) * (1 - durationDiscount)
    : null;

  const toggleScreen = (id: string) =>
    setForm(f => ({
      ...f,
      screens: f.screens.includes(id) ? f.screens.filter(s => s !== id) : [...f.screens, id],
    }));

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setErro("Preencha nome e datas da campanha."); return;
    }
    setLoading(true); setErro(""); setPaymentLink(null);
    try {
      const res = await fetch(`/api/advertiser/${code}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar campanha");
      setShowForm(false);
      setForm({ name: "", startDate: "", endDate: "", budget: "", screens: [] });
      if (data.payment_link) {
        setPaymentLink(data.payment_link);
      } else if (data.payment_error) {
        setErro(`Campanha criada, mas a cobrança falhou: ${data.payment_error}. Tente novamente.`);
      }
      onRefresh();
    } catch (err: any) {
      setErro(err.message || "Erro ao criar campanha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Campanhas</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>
            {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""} criada{campaigns.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={() => { setShowForm(v => !v); setErro(""); }} style={{
          background: C.primary, color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          + Nova Campanha
        </button>
      </div>

      {paymentLink && (
        <div style={{ background: C.warning + "18", border: `1px solid ${C.warning}66`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>⚡ Campanha criada — pague com Pix e entre no ar em minutos</div>
            <div style={{ fontSize: 13, color: C.textSub }}>Assim que o Pix cair, sua campanha aparece nas telas automaticamente — sem esperar aprovação manual. (Boleto também disponível, mas leva até 2 dias úteis para compensar.)</div>
          </div>
          <a href={paymentLink} target="_blank" rel="noopener noreferrer" style={{
            background: C.primary, color: "#fff", textDecoration: "none", borderRadius: 8,
            padding: "10px 20px", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
          }}>
            Pagar agora →
          </a>
        </div>
      )}

      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.primary}44`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 20 }}>Nova Campanha</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6 }}>NOME DA CAMPANHA *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Verão 2026" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6 }}>ORÇAMENTO (R$)</label>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0,00" style={inputStyle} />
              {suggestedTotal !== null && (
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                  Sugestão de mercado: <strong style={{ color: C.primary }}>R$ {suggestedTotal.toFixed(2)}</strong> para {durationDays} dia{durationDays !== 1 ? "s" : ""} × {form.screens.length} tela{form.screens.length !== 1 ? "s" : ""}
                  {durationDiscount > 0 && <span style={{ color: C.success }}> (desconto de {(durationDiscount * 100).toFixed(0)}% por campanha longa já aplicado)</span>}
                  {" "}— você decide o valor.
                  {durationDays > 0 && durationDays < 30 && (
                    <div style={{ color: C.success, marginTop: 2 }}>💡 Campanhas de 30+ dias ganham 15% de desconto na sugestão.</div>
                  )}
                  {durationDays >= 30 && durationDays < 90 && (
                    <div style={{ color: C.success, marginTop: 2 }}>💡 Campanhas de 90+ dias ganham 25% de desconto na sugestão.</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6 }}>DATA DE INÍCIO *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6 }}>DATA DE TÉRMINO *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 10 }}>
              TELAS ({form.screens.length} selecionada{form.screens.length !== 1 ? "s" : ""})
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {SCREENS.map(sc => {
                const sel = form.screens.includes(sc.id);
                return (
                  <div key={sc.id} onClick={() => toggleScreen(sc.id)} style={{
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${sel ? C.primary : C.border}`,
                    background: sel ? C.primary + "18" : "transparent",
                    display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${sel ? C.primary : C.muted}`,
                      background: sel ? C.primary : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        {sc.name}
                        {/* Fase 45 (16/08/2026): selo declarativo, ver components/ui/DtvReadyBadge.tsx */}
                        {sc.dtv_ready && <DtvReadyBadge enabled variant="compact" />}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSub }}>
                        {sc.city}
                        {sc.business_type && ` · ${sc.business_type}`}
                        {sc.screen_size && ` · tela ${sc.screen_size}`}
                        {sc.screen_orientation && ` · ${sc.screen_orientation === "portrait" ? "📱 vertical" : "🖥️ horizontal"}`}
                      </div>
                      <div style={{ fontSize: 11, color: C.primary, marginTop: 2 }}>
                        Sugestão: R$ {(BASE_PRICE_PER_DAY * Number(sc.price_multiplier ?? 1)).toFixed(2)}/dia
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {erro && (
            <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.danger }}>
              ⚠️ {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              background: C.primary, color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 24px", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1,
            }}>
              {loading ? "Salvando…" : "Criar Campanha"}
            </button>
            <button onClick={() => { setShowForm(false); setErro(""); }} style={{
              background: "transparent", color: C.textSub, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer",
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 12, border: `1px dashed ${C.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
          <div style={{ color: C.text, fontWeight: 600, marginBottom: 6 }}>Nenhuma campanha ainda</div>
          <div style={{ color: C.textSub, fontSize: 14 }}>Crie sua primeira campanha para começar a anunciar.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {campaigns.map((c: any) => (
            <div key={c.id}>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 24px",
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto", alignItems: "center", gap: 24,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.textSub }}>{fmtDate(c.startDate)} → {fmtDate(c.endDate)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{fmt(c.impressions)}</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>Impressões</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{c.screens?.length ?? 0}</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>Telas</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.success }}>{brl(c.budget)}</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>Orçamento</div>
                </div>
                <Badge status={c.status} />
              </div>
              {(c.status === "pending_payment" || c.status === "overdue") && c.payment?.invoice_url && (
                <div style={{
                  background: (c.status === "overdue" ? C.danger : C.warning) + "12",
                  border: `1px solid ${(c.status === "overdue" ? C.danger : C.warning)}33`,
                  borderRadius: 8, padding: "10px 16px", marginTop: 6,
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 13, color: C.textSub }}>
                    {c.status === "overdue" ? "⚠️ Pagamento em atraso — campanha pausada." : "⚡ Pague com Pix e entre no ar em minutos."}
                  </span>
                  <a href={c.payment.invoice_url} target="_blank" rel="noopener noreferrer" style={{
                    color: C.primary, fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>
                    Ver cobrança →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mídia ───────────────────────────────────────────────────────────────────
function TabMidia({ code, medias, campaigns, onRefresh }: { code: string; medias: any[]; campaigns: any[]; onRefresh: () => void }) {
  const [uploading, setUploading]               = useState(false);
  const [dragOver, setDragOver]                 = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [erro, setErro]                         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!selectedCampaign) { setErro("Selecione uma campanha primeiro."); return; }
    if (!files || files.length === 0) return;
    setUploading(true); setErro("");
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("files", f));
      formData.append("campaignId", selectedCampaign);
      const res = await fetch(`/api/advertiser/${code}/media`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload");
      onRefresh();
    } catch (err: any) {
      setErro(err.message || "Erro no upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Mídia</div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>Envie vídeos e imagens para suas campanhas</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 12, color: C.textSub, marginBottom: 6 }}>CAMPANHA</label>
        <select value={selectedCampaign} onChange={e => { setSelectedCampaign(e.target.value); setErro(""); }} style={{ ...inputStyle, marginBottom: 16 }}>
          <option value="">Selecione uma campanha…</option>
          {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {erro && (
          <div style={{ background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.danger }}>
            ⚠️ {erro}
          </div>
        )}

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.primary : C.border}`,
            borderRadius: 12, padding: "48px 24px", textAlign: "center",
            background: dragOver ? C.primary + "0A" : C.surface,
            cursor: "pointer", transition: "all .2s",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <div style={{ color: C.text, fontWeight: 600, marginBottom: 4 }}>
            {uploading ? "Enviando…" : "Arraste arquivos ou clique para selecionar"}
          </div>
          <div style={{ color: C.textSub, fontSize: 13 }}>MP4, MOV, JPG, PNG — máx. 50 MB por arquivo</div>
          <input ref={fileRef} type="file" accept="video/*,image/*" multiple style={{ display: "none" }} onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {medias.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: C.surface, borderRadius: 12, border: `1px dashed ${C.border}` }}>
          <div style={{ color: C.textSub, fontSize: 14 }}>Nenhum arquivo enviado ainda.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {medias.map((m: any) => (
            <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ height: 130, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                {m.type === "video" ? "🎬" : "🖼️"}
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.textSub, marginBottom: 8 }}>{m.campaignName}</div>
                <Badge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Relatórios ──────────────────────────────────────────────────────────────
function TabRelatorios({ campaigns, code }: { campaigns: any[]; code: string }) {
  const [selected, setSelected] = useState(campaigns[0]?.id ?? "");
  const campaign = campaigns.find(c => c.id === selected);

  const totalImpressions = campaigns.reduce((a, c) => a + (c.impressions ?? 0), 0);
  const totalBudget      = campaigns.reduce((a, c) => a + Number(c.budget ?? 0), 0);
  const activeCampaigns  = campaigns.filter(c => c.status === "active").length;
  const cpm = totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;

  // Exibições reais por dia — antes era Math.random(), mudando a cada
  // reload da página e mostrando dado completamente fictício pra quem
  // está pagando pela campanha.
  const [days, setDays] = useState<{ label: string; value: number }[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  useEffect(() => {
    fetch(`/api/advertiser/${code}/daily-stats`)
      .then(r => r.json())
      .then(d => setDays(d.days ?? []))
      .catch(() => setDays([]))
      .finally(() => setLoadingDays(false));
  }, [code]);
  const maxVal = Math.max(1, ...days.map(d => d.value));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Relatórios</div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>Desempenho geral de todas as campanhas</div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <KpiCard label="Impressões Totais"  value={fmt(totalImpressions)} color={C.primary} />
        <KpiCard label="Campanhas Ativas"   value={activeCampaigns}       color={C.success} />
        <KpiCard label="Investimento Total" value={brl(totalBudget)}      color={C.purple}  />
        <KpiCard label="CPM Médio"          value={brl(cpm)}              sub="por mil impressões" />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>Exibições por dia (últimos 7 dias)</div>
        {loadingDays ? (
          <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "20px 0" }}>Carregando…</div>
        ) : days.every(d => d.value === 0) ? (
          <div style={{ textAlign: "center", color: C.textSub, fontSize: 13, padding: "20px 0" }}>Nenhuma exibição registrada nos últimos 7 dias.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160 }}>
            {days.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, color: C.textSub }}>{fmt(d.value)}</div>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(d.value / maxVal) * 120}px`, background: `linear-gradient(180deg, ${C.primary}, ${C.primaryDim})` }} />
                <div style={{ fontSize: 11, color: C.textSub }}>{d.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {campaigns.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Detalhes por Campanha</div>
          <div style={{ marginBottom: 16 }}>
            <select value={selected} onChange={e => setSelected(e.target.value)} style={inputStyle}>
              {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {campaign && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
              {[
                { label: "STATUS",       content: <Badge status={campaign.status} /> },
                { label: "PERÍODO",      content: <div style={{ fontSize: 13, color: C.text }}>{fmtDate(campaign.startDate)} – {fmtDate(campaign.endDate)}</div> },
                { label: "IMPRESSÕES",   content: <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{fmt(campaign.impressions)}</div> },
                { label: "TELAS ATIVAS", content: <div style={{ fontSize: 22, fontWeight: 700, color: C.success }}>{campaign.screens?.length ?? 0}</div> },
                { label: "ORÇAMENTO",    content: <div style={{ fontSize: 18, fontWeight: 700, color: C.purple }}>{brl(campaign.budget)}</div> },
              ].map(item => (
                <div key={item.label} style={{ padding: "14px 18px", background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: C.textSub, marginBottom: 6 }}>{item.label}</div>
                  {item.content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
function PortalAnuncianteInner({ code }: { code: string }) {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState("campanhas");

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/advertiser/${code}`);
      if (res.status === 404) { setError("Anunciante não encontrado."); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [code]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
        <div style={{ color: C.textSub }}>Carregando seu portal…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: C.danger }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div>{error}</div>
      </div>
    </div>
  );

  const tabs = [
    { id: "campanhas",  label: "Campanhas",  icon: "📢" },
    { id: "midia",      label: "Mídia",      icon: "🎬" },
    { id: "relatorios", label: "Relatórios", icon: "📊" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select { color-scheme: dark; }
        input::placeholder { color: #6B7280; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.muted}; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

            {/* ✅ Logo corrigido: gradiente + ícone monitor + DOOH branco / PLAY azul */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  <span style={{ color: C.text }}>DOOH</span><span style={{ color: C.primary }}>PLAY</span>
                </div>
                <div style={{ fontSize: 11, color: C.textSub }}>Portal do Anunciante</div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{data?.advertiser?.name}</div>
              <div style={{ fontSize: 12, color: C.textSub }}>#{code.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "14px 20px", fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? C.primary : C.textSub,
              borderBottom: `2px solid ${tab === t.id ? C.primary : "transparent"}`,
              display: "flex", alignItems: "center", gap: 8, transition: "all .15s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {tab === "campanhas"  && <TabCampanhas  code={code} campaigns={data?.campaigns ?? []} onRefresh={load} />}
        {tab === "midia"      && <TabMidia      code={code} medias={data?.medias ?? []} campaigns={data?.campaigns ?? []} onRefresh={load} />}
        {tab === "relatorios" && <TabRelatorios campaigns={data?.campaigns ?? []} code={code} />}
      </div>
    </div>
  );
}

// Next.js 15: params é Promise
export default function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0B1020", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#9CA3AF" }}>Carregando…</div>
      </div>
    }>
      <PortalAnuncianteInner code={code} />
    </Suspense>
  );
}
