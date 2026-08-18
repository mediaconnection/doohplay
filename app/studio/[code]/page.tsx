"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import SchedulerEditor from "@/components/SchedulerEditor"
// Fase 44 (21/08/2026): TEMPLATES extraído pra lib/studioTemplates.ts —
// era a causa dos "3 templates que não renderizam diferente" (ver spec do
// Studio). O dado sempre existiu certo aqui pro preview; agora a rota de
// publicação (app/api/studio/publish/route.ts) importa a MESMA lista, em
// vez de recalcular cor fixa por segmento e ignorar qual template foi
// escolhido.
import { STUDIO_TEMPLATES, type StudioTemplate } from "@/lib/studioTemplates"

type Client = {
  id: string
  name: string
  business_type: string
  primary_color: string
  phone: string | null
  address: string | null
  logo_url: string | null
  screen_id: string | null
  playlist_id: string | null
}

type Template = StudioTemplate
const TEMPLATES = STUDIO_TEMPLATES

function AdPreview({ tpl, client, form, imageUrl }: {
  tpl: Template
  client: Client
  form: { headline: string; subline: string; cta: string; phone: string }
  imageUrl?: string | null
}) {
  const isLight = tpl.bg.startsWith("#f")
  const textColor = isLight ? "#1a1a1a" : "#ffffff"
  const mutedColor = isLight ? "#00000060" : "#ffffff70"
  return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: tpl.bg, borderRadius: 12, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", boxSizing: "border-box" }}>
      {imageUrl && <img src={imageUrl} alt="bg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 70% at 80% 20%, ${tpl.accent}15 0%, transparent 70%)` }} />
      {!imageUrl && <div style={{ fontSize: 48, marginBottom: 16, position: "relative" }}>{tpl.emoji}</div>}
      <div style={{ fontSize: 13, color: tpl.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8, position: "relative", fontWeight: 700 }}>{client.name}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: textColor, textAlign: "center", lineHeight: 1.1, position: "relative", fontFamily: "Georgia, serif" }}>{form.headline || tpl.headline}</div>
      <div style={{ fontSize: 14, color: mutedColor, marginTop: 10, textAlign: "center", position: "relative" }}>{form.subline || tpl.subline}</div>
      <div style={{ marginTop: 20, background: tpl.accent, color: isLight ? "#fff" : "#000", borderRadius: 999, padding: "8px 24px", fontSize: 13, fontWeight: 700, position: "relative" }}>{form.cta || tpl.cta}</div>
      {form.phone && <div style={{ position: "absolute", bottom: 16, right: 16, fontSize: 11, color: mutedColor }}>{form.phone}</div>}
      <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: 8, color: `${tpl.accent}60`, letterSpacing: "0.1em", textTransform: "uppercase" }}>DOOHPLAY</div>
    </div>
  )
}

type Tab = "editor" | "ai" | "playlist" | "scheduler"

export default function StudioEditorPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("editor")
  const [selectedTpl, setSelectedTpl] = useState<Template | null>(null)
  const [form, setForm] = useState({ headline: "", subline: "", cta: "", phone: "", duration: "15" })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [publishError, setPublishError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishedItems, setPublishedItems] = useState<{ title: string; time: string }[]>([])
  const [mediaTab, setMediaTab] = useState<"template" | "youtube" | "video" | "live">("template")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [streamUrl, setStreamUrl] = useState("")
  const [playlistItems, setPlaylistItems] = useState<{id:string;asset_url:string;type:string;duration:number;position:number;starts_at:string|null;ends_at:string|null}[]>([])
  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingDates, setEditingDates] = useState<string | null>(null)
  const [dateForm, setDateForm] = useState<{ starts_at: string; ends_at: string }>({ starts_at: "", ends_at: "" })
  const [savingDates, setSavingDates] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{ headline: string; subline: string; cta: string; image_url: string | null } | null>(null)
  const [aiError, setAiError] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiQuota, setAiQuota] = useState<{ used: number; limit: number; unlimited?: boolean } | null>(null)

  useEffect(() => { if (activeTab === "playlist") loadPlaylist() }, [activeTab, client])

  useEffect(() => {
    if (!client) return
    fetch(`/api/studio/ai-generate?type=${client.business_type}`).then(r => r.json()).then(d => { if (d.suggestions) setAiSuggestions(d.suggestions) }).catch(() => {})
    // Fase 17: cota de gerações de IA por plano — mesma rota que já
    // mostra uso de telas, agora também devolve isso.
    fetch(`/api/client/plan-usage/${code}`).then(r => r.json()).then(d => { if (d.aiGenerations) setAiQuota(d.aiGenerations) }).catch(() => {})
  }, [client])

  useEffect(() => {
    fetch(`/api/studio/auth?code=${code}`).then(r => r.json()).then(d => {
      if (!d.ok) { router.push("/studio"); return }
      setClient(d.client)
      const templates = TEMPLATES[d.client.business_type] ?? TEMPLATES.barber
      setSelectedTpl(templates[0])
      setForm(f => ({ ...f, phone: d.client.phone ?? "" }))
    }).catch(() => router.push("/studio")).finally(() => setLoading(false))
  }, [code, router])

  const handleUpload = async (file: File) => {
    setUploading(true); setUploadError("")
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("code", code)
      const res = await fetch("/api/studio/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.ok) setImageUrl(data.url); else setUploadError(data.error ?? "Erro no upload")
    } catch { setUploadError("Erro de conexao") } finally { setUploading(false) }
  }

  const handlePublish = async () => {
    if (!selectedTpl || !client) return
    const headline = form.headline.trim() || selectedTpl.headline
    setPublishing(true); setPublishError("")
    try {
      const res = await fetch("/api/studio/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        code, type: "template",
        // Fase 44: manda qual dos 3 templates foi escolhido de verdade —
        // antes disso, a publicação sempre ignorava a escolha e caía num
        // visual genérico fixo por segmento (bug corrigido nesta fase).
        template_id: selectedTpl.id,
        headline, subline: form.subline || selectedTpl.subline, cta: form.cta || selectedTpl.cta || "Saiba mais",
        photo_url: imageUrl || undefined,
        duration: parseInt(form.duration) || 15,
      }) })
      const data = await res.json()
      if (data.ok) { setPublished(true); setPublishedItems(prev => [{ title: headline, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]); setTimeout(() => setPublished(false), 4000) }
      else setPublishError(data.error ?? "Erro ao publicar")
    } catch { setPublishError("Erro de conexão") } finally { setPublishing(false) }
  }

  const handlePublishYouTube = async () => {
    if (!youtubeUrl.trim()) return; setPublishing(true); setPublishError("")
    try {
      const res = await fetch("/api/studio/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, asset_url: youtubeUrl.trim(), type: "youtube", duration: 60, title: `YouTube — ${youtubeUrl.slice(0, 40)}` }) })
      const data = await res.json()
      if (data.ok) { setYoutubeUrl(""); setPublished(true); setPublishedItems(prev => [{ title: `YouTube: ${youtubeUrl.slice(0,30)}...`, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]); setTimeout(() => setPublished(false), 3000) }
      else setPublishError(data.error ?? "Erro ao publicar")
    } catch { setPublishError("Erro de conexão") } finally { setPublishing(false) }
  }

  const handlePublishLive = async () => {
    if (!streamUrl.trim()) return; setPublishing(true); setPublishError("")
    try {
      const res = await fetch("/api/studio/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, asset_url: streamUrl.trim(), type: "hls", duration: 3600, title: `Live — ${streamUrl.slice(0, 40)}` }) })
      const data = await res.json()
      if (data.ok) { setStreamUrl(""); setPublished(true); setPublishedItems(prev => [{ title: "Live stream publicado", time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]); setTimeout(() => setPublished(false), 3000) }
      else setPublishError(data.error ?? "Erro ao publicar")
    } catch { setPublishError("Erro de conexão") } finally { setPublishing(false) }
  }

  const handleVideoUpload = async (file: File) => {
    setVideoUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("code", code)
      const res = await fetch("/api/studio/upload", { method: "POST", body: fd })
      const data = await res.json(); if (data.ok) setVideoUrl(data.url)
    } catch {} finally { setVideoUploading(false) }
  }

  const handlePublishVideo = async () => {
    if (!videoUrl) return; setPublishing(true); setPublishError("")
    try {
      const res = await fetch("/api/studio/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, asset_url: videoUrl, type: "video", duration: 30, title: `Vídeo — ${videoUrl.split("/").pop()}` }) })
      const data = await res.json()
      if (data.ok) { setVideoUrl(null); setPublished(true); setPublishedItems(prev => [{ title: `Vídeo publicado`, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]); setTimeout(() => setPublished(false), 3000) }
      else setPublishError(data.error ?? "Erro ao publicar")
    } catch { setPublishError("Erro de conexão") } finally { setPublishing(false) }
  }

  // Achado numa revisão de código (12/07/2026): estas 4 funções liam e
  // escreviam em /api/studio/playlist, que guardava tudo numa tabela órfã
  // (playlist_items) que o player real (app/player/page.tsx) nunca lê.
  // Trocado pela mesma rota real que o dashboard usa (/api/client/playlist/
  // [code], já migrada pra fundação unificada). Filtra só slot_category
  // 'dono' — mídia institucional/de rede aparece no player mas não é
  // editável/removível por aqui, então não faz sentido misturar na lista.
  const loadPlaylist = async () => {
    if (!client) return; setPlaylistLoading(true)
    try {
      const res = await fetch(`/api/client/playlist/${code}`)
      const data = await res.json()
      const own = (data.items ?? []).filter((i: any) => i.slot_category === "dono")
      setPlaylistItems(own.map((i: any) => ({
        id: i.id, asset_url: i.asset_url, type: i.type,
        duration: i.duration ?? 15, position: i.position ?? 0,
        starts_at: i.start_date ?? null, ends_at: i.end_date ?? null,
      })))
    } catch {} finally { setPlaylistLoading(false) }
  }

  // Sistema real não tem DELETE — remover vira "desativar" (active=false),
  // mesmo padrão de soft-delete já usado no resto do app.
  const removeItem = async (itemId: string) => {
    if (!confirm("Remover este item da playlist?")) return
    const item = playlistItems.find(i => i.id === itemId)
    try {
      await fetch(`/api/client/playlist/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        items: [{ id: itemId, position: item?.position ?? 0, duration: item?.duration ?? 15, active: false }],
      }) })
      setPlaylistItems(prev => prev.filter(i => i.id !== itemId))
    } catch {}
  }

  const moveItem = async (fromId: string, toId: string) => {
    const items = [...playlistItems]
    const fromIdx = items.findIndex(i => i.id === fromId); const toIdx = items.findIndex(i => i.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = items.splice(fromIdx, 1); items.splice(toIdx, 0, moved)
    const reordered = items.map((item, idx) => ({ ...item, position: idx + 1 }))
    setPlaylistItems(reordered)
    try {
      await fetch(`/api/client/playlist/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        items: reordered.map(i => ({ id: i.id, position: i.position, duration: i.duration, active: true })),
      }) })
    } catch {}
  }

  const saveDates = async (itemId: string) => {
    setSavingDates(true)
    const item = playlistItems.find(i => i.id === itemId)
    try {
      await fetch(`/api/client/playlist/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        items: [{
          id: itemId, position: item?.position ?? 0, duration: item?.duration ?? 15, active: true,
          start_date: dateForm.starts_at || null, end_date: dateForm.ends_at || null,
        }],
      }) })
      setPlaylistItems(prev => prev.map(i => i.id === itemId ? { ...i, starts_at: dateForm.starts_at || null, ends_at: dateForm.ends_at || null } : i))
      setEditingDates(null)
    } catch {} finally { setSavingDates(false) }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !client) return; setAiGenerating(true); setAiError(""); setAiResult(null)
    try {
      const res = await fetch("/api/studio/ai-generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, prompt: aiPrompt, business_name: client.name, business_type: client.business_type, client_color: clientAccent }) })
      const data = await res.json()
      if (data.ok) { setAiResult(data); setForm(f => ({ ...f, headline: data.headline, subline: data.subline, cta: data.cta })); if (data.image_url) setImageUrl(data.image_url); fetch(`/api/client/plan-usage/${code}`).then(r => r.json()).then(d => { if (d.aiGenerations) setAiQuota(d.aiGenerations) }).catch(() => {}) }
      else setAiError(data.error ?? "Erro ao gerar conteúdo")
    } catch { setAiError("Erro de conexão") } finally { setAiGenerating(false) }
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#0284C7", fontSize: 16 }}>Carregando studio...</div>
    </main>
  )

  if (!client || !selectedTpl) return null

  const templates = TEMPLATES[client.business_type] ?? TEMPLATES.barber
  const BRAND = "#0284C7"
  const BRAND_LIGHT = "#F0F9FF"
  const BRAND_DARK = "#0369A1"
  const clientAccent = client.primary_color.startsWith("#") ? client.primary_color : `#${client.primary_color}`
  const playlistId = client.playlist_id ?? "bbbbbbbb-0001-0001-0001-000000000001"

  return (
    <main style={{ minHeight: "100vh", background: "#f3f4f6", color: "#111", fontFamily: "system-ui, sans-serif" }}>

      <header style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: BRAND, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>DOOHPLAY Studio</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginTop: 2 }}>{client.name}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: "#16a34a20", border: "1px solid #16a34a40", borderRadius: 999, padding: "4px 12px", fontSize: 11, color: "#16a34a" }}>Tela online</div>
          {/* Achado na varredura ampla (17/08/2026): estava hardcoded pra /zimerman,
              então qualquer cliente usando o Studio caía no portal do Zimermam ao
              clicar aqui. Corrigido pra usar a rota genérica /portal/[code]. */}
          <button onClick={() => router.push(`/portal/${code}`)} style={{ background: "transparent", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#6b7280", cursor: "pointer" }}>Ver portal</button>
        </div>
      </header>

      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "0 1.5rem", display: "flex", gap: 0 }}>
        {([
          { key: "editor", label: "✏️  Editor de anúncios" },
          { key: "ai", label: "✨  IA" },
          { key: "playlist", label: "📋  Playlist" },
          { key: "scheduler", label: "🕐  Grade de programação" },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: "transparent", border: "none", borderBottom: activeTab === tab.key ? "2px solid #0284C7" : "2px solid transparent", padding: "14px 20px", fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? "#111" : "#9ca3af", cursor: "pointer", marginBottom: "-1px" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── EDITOR ── */}
      {activeTab === "editor" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Escolha o template</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {templates.map(tpl => (
                  <button key={tpl.id} onClick={() => { setSelectedTpl(tpl); setForm(f => ({ ...f, headline: "", subline: "", cta: "" })) }} style={{ background: selectedTpl.id === tpl.id ? BRAND_LIGHT : "#f9fafb", border: selectedTpl.id === tpl.id ? `1.5px solid ${BRAND}` : "0.5px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: selectedTpl.id === tpl.id ? BRAND_DARK : "#6b7280", fontSize: 12, fontWeight: selectedTpl.id === tpl.id ? 600 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{tpl.emoji}</span> {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Preview ao vivo</div>
              <AdPreview tpl={selectedTpl} client={{...client, primary_color: clientAccent.replace("#","")}} form={form} imageUrl={imageUrl} />
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Imagem de fundo (opcional)</div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
              {imageUrl ? (
                <div style={{ position: "relative" }}>
                  <img src={imageUrl} alt="preview" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
                  <button onClick={() => setImageUrl(null)} style={{ position: "absolute", top: 6, right: 6, background: "#000000cc", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Remover</button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${uploading ? BRAND : "#d1d5db"}`, borderRadius: 10, padding: "1.5rem", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer" }}>
                  {uploading ? <div style={{ fontSize: 13, color: BRAND }}>Enviando imagem...</div> : (<><div style={{ fontSize: 24, marginBottom: 6 }}>🖼</div><div style={{ fontSize: 13, color: "#6b7280" }}>Clique para fazer upload</div><div style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>JPG, PNG ou WebP - max 10MB</div></>)}
                </div>
              )}
              {uploadError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{uploadError}</div>}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem" }}>
              <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Personalize o anuncio</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ key: "headline", label: "Titulo principal", placeholder: selectedTpl.headline }, { key: "subline", label: "Subtitulo", placeholder: selectedTpl.subline }, { key: "cta", label: "Chamada para acao", placeholder: selectedTpl.cta }, { key: "phone", label: "Telefone / WhatsApp", placeholder: "(11) 99999-9999" }].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>{field.label}</label>
                    <input value={form[field.key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>Duracao na tela</label>
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", outline: "none", width: 160 }}>
                  <option value="10">10 segundos</option>
                  <option value="15">15 segundos</option>
                  <option value="30">30 segundos</option>
                  <option value="60">60 segundos</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: "#fff", border: `1px solid #BAE6FD`, borderRadius: 16, overflow: "hidden", marginBottom: "1rem", position: "sticky", top: "1rem" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
                {([{ key: "template", label: "🎨 Template" }, { key: "youtube", label: "▶ YouTube" }, { key: "video", label: "🎬 Vídeo" }, { key: "live", label: "🔴 Live" }] as { key: "template" | "youtube" | "video" | "live"; label: string }[]).map(t => (
                  <button key={t.key} onClick={() => setMediaTab(t.key)} style={{ flex: 1, padding: "10px 4px", background: "transparent", border: "none", borderBottom: mediaTab === t.key ? `2px solid ${BRAND}` : "2px solid transparent", fontSize: 11, fontWeight: mediaTab === t.key ? 600 : 400, color: mediaTab === t.key ? "#111" : "#9ca3af", cursor: "pointer", marginBottom: "-1px" }}>{t.label}</button>
                ))}
              </div>
              <div style={{ padding: "1.25rem" }}>
                {publishError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>{publishError}</div>}
                {mediaTab === "template" && (<><div style={{ fontSize: 12, color: "#6b7280", marginBottom: "1rem", lineHeight: 1.5 }}>O template selecionado aparecerá na tela da {client.name} em instantes.</div><button onClick={handlePublish} disabled={publishing} style={{ width: "100%", background: publishing ? "#7DD3FA" : BRAND, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 700, cursor: publishing ? "not-allowed" : "pointer", letterSpacing: "0.05em", textTransform: "uppercase" }}>{publishing ? "Publicando..." : published ? "✓ Publicado!" : "Publicar na tela"}</button></>)}
                {mediaTab === "youtube" && (<><div style={{ fontSize: 12, color: "#6b7280", marginBottom: "12px", lineHeight: 1.5 }}>Cole a URL de qualquer vídeo do YouTube.</div><input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />{youtubeUrl && (<div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}><iframe src={`https://www.youtube.com/embed/${youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] ?? ""}?mute=1&controls=1`} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay" /></div>)}<button onClick={handlePublishYouTube} disabled={publishing || !youtubeUrl.trim()} style={{ width: "100%", background: !youtubeUrl.trim() ? "#f3f4f6" : BRAND, color: !youtubeUrl.trim() ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: !youtubeUrl.trim() ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>{publishing ? "Publicando..." : "Publicar YouTube"}</button></>)}
                {mediaTab === "video" && (<><div style={{ fontSize: 12, color: "#6b7280", marginBottom: "12px", lineHeight: 1.5 }}>Faça upload de um vídeo MP4.</div><input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/mov" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }} />{videoUrl ? (<div style={{ marginBottom: 12 }}><video src={videoUrl} controls style={{ width: "100%", borderRadius: 8, maxHeight: 140 }} /><button onClick={() => setVideoUrl(null)} style={{ marginTop: 6, fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remover vídeo</button></div>) : (<div onClick={() => videoInputRef.current?.click()} style={{ border: `2px dashed ${videoUploading ? BRAND : "#d1d5db"}`, borderRadius: 10, padding: "1.5rem", textAlign: "center", cursor: videoUploading ? "not-allowed" : "pointer", marginBottom: 12 }}>{videoUploading ? <div style={{ fontSize: 13, color: BRAND }}>Enviando vídeo...</div> : (<><div style={{ fontSize: 24, marginBottom: 6 }}>🎬</div><div style={{ fontSize: 13, color: "#6b7280" }}>Clique para fazer upload</div></>)}</div>)}<button onClick={handlePublishVideo} disabled={publishing || !videoUrl} style={{ width: "100%", background: !videoUrl ? "#f3f4f6" : BRAND, color: !videoUrl ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: !videoUrl ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>{publishing ? "Publicando..." : "Publicar vídeo"}</button></>)}
                {mediaTab === "live" && (<><div style={{ fontSize: 12, color: "#6b7280", marginBottom: "12px", lineHeight: 1.5 }}>Cole a URL de um stream HLS (.m3u8).</div><input value={streamUrl} onChange={e => setStreamUrl(e.target.value)} placeholder="https://example.com/stream.m3u8" style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: 8 }} /><div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#92400e", marginBottom: 12 }}>⚡ O stream ficará ativo até ser removido manualmente.</div><button onClick={handlePublishLive} disabled={publishing || !streamUrl.trim()} style={{ width: "100%", background: !streamUrl.trim() ? "#f3f4f6" : "#ef4444", color: !streamUrl.trim() ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: !streamUrl.trim() ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>{publishing ? "Publicando..." : "🔴 Iniciar transmissão"}</button></>)}
                {published && <div style={{ marginTop: 10, fontSize: 12, color: "#16a34a", textAlign: "center" }}>✓ Adicionado à playlist!</div>}
                <div style={{ marginTop: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Cada exibição gera prova criptográfica</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["SHA-256", "Merkle", "Polygon", "ICP-Brasil"].map(tag => (<span key={tag} style={{ background: BRAND_LIGHT, border: `1px solid #BAE6FD`, borderRadius: 999, padding: "2px 8px", fontSize: 10, color: BRAND_DARK }}>{tag}</span>))}
                  </div>
                </div>
              </div>
            </div>
            {publishedItems.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Publicados nesta sessao</div>
                {publishedItems.map((item, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < publishedItems.length - 1 ? "1px solid #f3f4f6" : "none" }}><div style={{ fontSize: 12, color: "#111827" }}>{item.title}</div><div style={{ fontSize: 11, color: "#d1d5db" }}>{item.time}</div></div>))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── IA ── */}
      {activeTab === "ai" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
          <div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #0284C7, #7C3AED)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Gerador de anúncios com IA</div><div style={{ fontSize: 12, color: "#9ca3af" }}>Descreva o anúncio e a IA cria o texto</div></div>
              </div>
              {aiQuota && !aiQuota.unlimited && (
                <div style={{ fontSize: 11, color: aiQuota.used >= aiQuota.limit ? "#ef4444" : "#9ca3af", marginBottom: 10 }}>
                  {aiQuota.used}/{aiQuota.limit} gerações usadas este mês
                </div>
              )}
              <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ex: promoção de corte + barba para sexta-feira com 20% de desconto" rows={3} style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#111", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5, marginBottom: 10, fontFamily: "system-ui, sans-serif" }} />
              <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: aiGenerating || !aiPrompt.trim() ? "#f3f4f6" : "linear-gradient(135deg, #0284C7, #7C3AED)", color: aiGenerating || !aiPrompt.trim() ? "#9ca3af" : "#fff", fontSize: 14, fontWeight: 600, cursor: aiGenerating || !aiPrompt.trim() ? "not-allowed" : "pointer" }}>
                {aiGenerating ? "✨ Gerando..." : "✨ Gerar anúncio com IA"}
              </button>
              {aiError && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>{aiError}</div>}
            </div>
            {aiSuggestions.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Sugestões rápidas</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {aiSuggestions.map((s, i) => (<button key={i} onClick={() => setAiPrompt(s)} style={{ background: aiPrompt === s ? BRAND_LIGHT : "#f9fafb", border: aiPrompt === s ? `1.5px solid ${BRAND}` : "0.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: 13, color: aiPrompt === s ? BRAND_DARK : "#374151", textAlign: "left" }}>{s}</button>))}
                </div>
              </div>
            )}
            {aiResult && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Conteúdo gerado</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[{ label: "Headline", value: aiResult.headline }, { label: "Subline", value: aiResult.subline }, { label: "CTA", value: aiResult.cta }].map(f => (<div key={f.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div><div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{f.value}</div></div>))}
                </div>
                <div style={{ fontSize: 12, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px" }}>✓ Campos preenchidos automaticamente no Editor</div>
              </div>
            )}
          </div>
          <div style={{ position: "sticky", top: "1rem" }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Preview ao vivo</div>
              <AdPreview tpl={selectedTpl} client={{...client, primary_color: clientAccent.replace("#","")}} form={{ headline: aiResult?.headline || form.headline, subline: aiResult?.subline || form.subline, cta: aiResult?.cta || form.cta, phone: form.phone }} imageUrl={aiResult?.image_url || imageUrl} />
            </div>
            {aiResult && (<button onClick={() => { setActiveTab("editor"); handlePublish() }} style={{ width: "100%", background: BRAND, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>Publicar na tela</button>)}
            {!aiResult && (<div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.5rem", textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>✨</div><div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>Descreva o anúncio ao lado e a IA vai gerar o texto automaticamente.</div></div>)}
          </div>
        </div>
      )}

      {/* ── PLAYLIST ── */}
      {activeTab === "playlist" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Itens na playlist</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Arraste para reordenar · 📅 para definir validade · ✕ para remover</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadPlaylist} style={{ background: "#f9fafb", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#6b7280", cursor: "pointer" }}>↻ Atualizar</button>
              <button onClick={() => setActiveTab("editor")} style={{ background: "#0284C7", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Adicionar</button>
            </div>
          </div>

          {playlistLoading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Carregando...</div>
          ) : playlistItems.length === 0 ? (
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Playlist vazia</div>
              <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>Vá na aba <strong>✏️ Editor de anúncios</strong> e clique em<br/><strong>Publicar na tela</strong> para adicionar o primeiro item.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {playlistItems.map((item, i) => {
                const isYT = item.asset_url?.includes("youtube") || item.type === "youtube"
                const isVideo = item.type === "video" || /\.(mp4|webm)$/i.test(item.asset_url)
                const isLive = item.type === "hls" || item.type === "stream"
                const isUrl = item.type === "url"
                const typeIcon = isYT ? "▶" : isVideo ? "🎬" : isLive ? "🔴" : isUrl ? "🖥" : "🖼"
                const typeLabel = isYT ? "YouTube" : isVideo ? "Vídeo" : isLive ? "Live" : isUrl ? "Template" : "Imagem"
                const typeColor = isYT ? "#dc2626" : isVideo ? "#7c3aed" : isLive ? "#dc2626" : BRAND
                const typeBg = isYT ? "#fef2f2" : isVideo ? "#f5f3ff" : isLive ? "#fef2f2" : BRAND_LIGHT
                const typeBorder = isYT ? "#fecaca" : isVideo ? "#ddd6fe" : isLive ? "#fecaca" : "#BAE6FD"

                return (
                  <div key={item.id}>
                    <div
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      onDragOver={e => { e.preventDefault(); setDragOverId(item.id) }}
                      onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                      onDrop={() => { if (draggingId && draggingId !== item.id) moveItem(draggingId, item.id) }}
                      style={{ background: dragOverId === item.id ? BRAND_LIGHT : "#fff", border: `0.5px solid ${dragOverId === item.id ? BRAND : "#e5e7eb"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "grab", opacity: draggingId === item.id ? 0.5 : 1, transition: "all 0.1s" }}
                    >
                      <div style={{ color: "#d1d5db", fontSize: 16, userSelect: "none", flexShrink: 0 }}>⠿</div>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ width: 64, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: isYT ? "#1a0000" : isLive ? "#1a0000" : isVideo ? "#0a001a" : "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isUrl ? 10 : 18, color: isYT ? "#ef4444" : isLive ? "#ef4444" : isVideo ? "#a855f7" : "#C9A84C", fontWeight: 700 }}>
                        {isUrl ? (
                          <span style={{ fontSize: 9, color: "#C9A84C", textAlign: "center", padding: "0 2px", lineHeight: 1.2, letterSpacing: "0.02em" }}>
                            {decodeURIComponent(item.asset_url?.match(/[?&]h=([^&]+)/)?.[1] || "").slice(0, 12) || "AD"}
                          </span>
                        ) : <span>{typeIcon}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#111827", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {isYT
                          ? (item.asset_url?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] ? `YouTube: ${item.asset_url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]?.slice(0,12)}...` : "YouTube")
                          : isLive ? "Live stream"
                          : isVideo ? (item.asset_url?.split("/").pop()?.split("?")[0] || "Vídeo")
                          : isUrl ? (item.asset_url?.match(/[?&]h=([^&]+)/)?.[1] ? decodeURIComponent(item.asset_url.match(/[?&]h=([^&]+)/)?.[1] || "") : "Template")
                          : "Mídia"}
                      </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ background: typeBg, border: `0.5px solid ${typeBorder}`, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 500, color: typeColor }}>{typeIcon} {typeLabel}</span>
                          <span style={{ background: "#f3f4f6", borderRadius: 20, padding: "1px 8px", fontSize: 10, color: "#6b7280" }}>{item.duration}s</span>
                          {(item.starts_at || item.ends_at) && <span style={{ background: BRAND_LIGHT, border: `0.5px solid #BAE6FD`, borderRadius: 20, padding: "1px 8px", fontSize: 10, color: BRAND_DARK }}>📅 Agendado</span>}
                        </div>
                      </div>
                      <button onClick={() => { setEditingDates(editingDates === item.id ? null : item.id); setDateForm({ starts_at: item.starts_at ? item.starts_at.slice(0,16) : "", ends_at: item.ends_at ? item.ends_at.slice(0,16) : "" }) }} title="Definir validade" style={{ background: (item.starts_at || item.ends_at) ? BRAND_LIGHT : "#f9fafb", border: `0.5px solid ${(item.starts_at || item.ends_at) ? "#BAE6FD" : "#e5e7eb"}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: (item.starts_at || item.ends_at) ? BRAND : "#9ca3af", cursor: "pointer", flexShrink: 0 }}>📅</button>
                      <button onClick={() => removeItem(item.id)} style={{ background: "#fef2f2", border: "0.5px solid #fecaca", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>

                    {editingDates === item.id && (
                      <div style={{ marginTop: 6, padding: "12px 16px", background: BRAND_LIGHT, borderRadius: 10, border: `0.5px solid #BAE6FD` }}>
                        <div style={{ fontSize: 11, color: BRAND_DARK, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Validade do item</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Início (opcional)</div>
                            <input type="datetime-local" value={dateForm.starts_at} onChange={e => setDateForm(f => ({ ...f, starts_at: e.target.value }))} style={{ background: "#fff", border: `0.5px solid #BAE6FD`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#111", outline: "none" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Fim (opcional)</div>
                            <input type="datetime-local" value={dateForm.ends_at} onChange={e => setDateForm(f => ({ ...f, ends_at: e.target.value }))} style={{ background: "#fff", border: `0.5px solid #BAE6FD`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#111", outline: "none" }} />
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => saveDates(item.id)} disabled={savingDates} style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{savingDates ? "Salvando..." : "Salvar"}</button>
                            <button onClick={() => setDateForm({ starts_at: "", ends_at: "" })} style={{ background: "#fff", color: "#6b7280", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>Limpar</button>
                          </div>
                        </div>
                        {(item.starts_at || item.ends_at) && (
                          <div style={{ marginTop: 8, fontSize: 11, color: BRAND_DARK }}>
                            {item.starts_at && <span>De: {new Date(item.starts_at).toLocaleString("pt-BR")} </span>}
                            {item.ends_at && <span>Até: {new Date(item.ends_at).toLocaleString("pt-BR")}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ padding: "8px 0", textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{playlistItems.length} {playlistItems.length === 1 ? "item" : "itens"} · arraste para reordenar</div>
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDULER ── */}
      {activeTab === "scheduler" && (
        <div style={{ minHeight: "calc(100vh - 110px)", background: "#f3f4f6" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>Configure em quais dias e horários cada anúncio aparece na tela. Itens sem regra ficam sempre ativos.</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <SchedulerEditor playlistId={playlistId} />
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
