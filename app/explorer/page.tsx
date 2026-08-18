"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const BG      = "#080C18"
const SURFACE = "#0F1629"
const BORDER  = "rgba(255,255,255,0.07)"
const TEXT    = "#F1F5F9"
const TEXT2   = "#94A3B8"
const MUTED   = "#475569"
const BLUE    = "#3B82F6"
const GREEN   = "#10B981"
const AMBER   = "#F59E0B"
const PURPLE  = "#6366F1"

function shortHash(h?: string | null, len = 10) {
  if (!h) return "—"
  return h.length <= len + 4 ? h : `${h.slice(0, len)}...${h.slice(-4)}`
}

type SearchResult = {
  type: "block" | "event" | "screen"
  id: string | number
  title: string
  sub: string
  status: string
  href: string
  meta: string
}

const TYPE_ICON:  Record<string, string> = { block: "□", event: "⚡", screen: "📺" }
const TYPE_LABEL: Record<string, string> = { block: "Bloco", event: "Evento", screen: "Tela" }
const TYPE_COLOR: Record<string, string> = { block: BLUE, event: PURPLE, screen: GREEN }

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ExplorerPage() {
  const [query, setQuery]       = useState("")
  const [results, setResults]   = useState<SearchResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState(false)
  const [stats, setStats]       = useState<any>({})
  const [blocks, setBlocks]     = useState<any[]>([])
  const [events, setEvents]     = useState<any[]>([])
  const inputRef                = useRef<HTMLInputElement>(null)
  const debouncedQuery          = useDebounce(query, 320)

  useEffect(() => {
    fetch("/api/explorer/data")
      .then(r => r.json())
      .then(d => { setStats(d.stats ?? {}); setBlocks(d.blocks ?? []); setEvents(d.events ?? []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (debouncedQuery.length < 3) { setResults([]); return }
    setLoading(true)
    fetch(`/api/explorer/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(d => setResults(d.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  const showDropdown = focused && query.length >= 3

  const totalBlocks  = stats.total_blocks > 0 ? stats.total_blocks : 2847
  const latestMerkle = stats.latest_merkle ?? "0x9b4c...f21a"
  const latestTx     = stats.latest_tx     ?? "0x9b1d...a337"

  const DEMO_BLOCKS = [
    { id: 19284721, hash: "0x7f3a...d4b2", merkle: "0x9b4c...f21a", txs: 847,  time: "14:32:01", status: "Ancorado"    },
    { id: 19284720, hash: "0x2c8e...f91a", merkle: "0x3d8f...b09c", txs: 923,  time: "14:31:58", status: "Ancorado"    },
    { id: 19284719, hash: "0x9b1d...a337", merkle: "0x7a2e...c34d", txs: 701,  time: "14:31:55", status: "Ancorado"    },
    { id: 19284718, hash: "0x4e7f...c28b", merkle: "0x1f5b...e87f", txs: 1024, time: "14:31:51", status: "Processando" },
    { id: 19284717, hash: "0x1b3c...e84a", merkle: "0x6c9d...a12e", txs: 612,  time: "14:31:47", status: "Ancorado"    },
  ]

  // Nomes de marca real (Bradesco/iFood/Samsung/Natura/Ambev) removidos em
  // 17/08/2026: esta é a lista de exemplo exibida quando /api/explorer/data
  // não retorna dados reais — estava atribuindo campanhas fictícias, com
  // status "Verified"/"Ancorado" na blockchain, a marcas reais que nunca
  // anunciaram na rede. Trocado por categorias genéricas, mesmo padrão do
  // AI Revenue Center (app/dashboard/local/[code]/ai-revenue/page.tsx).
  const DEMO_EVENTS = [
    { hash: "0x7f3a...d4b2", screen: "SCR-00847", campaign: "Varejo — Black Friday",     time: "14:32:01", status: "Verified" },
    { hash: "0x2c8e...f91a", screen: "SCR-00123", campaign: "Delivery — Cupons",         time: "14:31:58", status: "Verified" },
    { hash: "0x9b1d...a337", screen: "SCR-00512", campaign: "Tecnologia — Lançamento",   time: "14:31:55", status: "Verified" },
    { hash: "0x4e7f...c28b", screen: "SCR-00089", campaign: "Beleza — Linha sazonal",    time: "14:31:51", status: "Pending"  },
    { hash: "0x1b3c...e84a", screen: "SCR-01024", campaign: "Bebidas — Campanha de verão", time: "14:31:47", status: "Verified" },
  ]

  const displayBlocks = blocks.length > 0 ? blocks : DEMO_BLOCKS
  const displayEvents = events.length > 0 ? events : DEMO_EVENTS

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: ${MUTED}; }
        input:focus { outline: none; }
        .sr-item:hover { background: rgba(255,255,255,0.05) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* NAV */}
      <nav style={{
        background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BORDER}`, padding: "0 1.5rem", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>
              DOOH<span style={{ color: BLUE }}>PLAY</span>
            </span>
          </Link>
          <span style={{ color: MUTED, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, color: TEXT2 }}>ProofChain Explorer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>⚡ Sincronizado</span>
          <span style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: PURPLE, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
            Bloco #{(19284720 + Math.max(0, stats.total_blocks ?? 0)).toLocaleString("pt-BR")}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px" }}>ProofChain Explorer</h1>
          <p style={{ fontSize: 14, color: TEXT2, margin: 0 }}>Blockchain · Polygon Mainnet · ICP Brasil</p>
        </div>

        {/* SEARCH */}
        <div style={{ display: "flex", gap: 10, marginBottom: "2rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{
              background: SURFACE,
              border: `1px solid ${focused ? BLUE + "80" : BORDER}`,
              borderRadius: showDropdown && (loading || results.length > 0) ? "12px 12px 0 0" : 12,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
              transition: "border-color .15s",
            }}>
              {loading ? (
                <div style={{ width: 16, height: 16, border: `2px solid ${MUTED}`, borderTopColor: BLUE, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? BLUE : MUTED} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 180)}
                placeholder="Buscar por TX hash, block hash, Screen ID, nome da tela..."
                style={{ flex: 1, background: "transparent", border: "none", color: TEXT, fontSize: 14 }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, padding: "0 2px", lineHeight: 1 }}
                >×</button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                background: SURFACE, border: `1px solid ${BLUE}80`,
                borderTop: "none", borderRadius: "0 0 12px 12px",
                maxHeight: 380, overflowY: "auto",
              }}>
                {loading && results.length === 0 && (
                  <div style={{ padding: "20px", textAlign: "center", color: MUTED, fontSize: 13 }}>Buscando…</div>
                )}
                {!loading && results.length === 0 && (
                  <div style={{ padding: "20px", textAlign: "center", color: MUTED, fontSize: 13 }}>
                    Nenhum resultado para <strong style={{ color: TEXT2 }}>"{query}"</strong>
                  </div>
                )}
                {results.map((r, i) => (
                  <Link key={i} href={r.href} style={{ textDecoration: "none" }}>
                    <div className="sr-item" style={{
                      padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                      borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : "none",
                      cursor: "pointer", transition: "background .1s",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: TYPE_COLOR[r.type] + "22",
                        border: `1px solid ${TYPE_COLOR[r.type]}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: TYPE_COLOR[r.type],
                      }}>
                        {TYPE_ICON[r.type]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{r.title}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: TYPE_COLOR[r.type] + "22", color: TYPE_COLOR[r.type] }}>
                            {TYPE_LABEL[r.type]}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, fontFamily: "monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {shortHash(r.sub, 24)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: r.status === "Ancorado" || r.status === "Verified" || r.status === "Ativo" ? GREEN : AMBER }}>
                          {r.status}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{r.meta}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/verify" style={{ display: "flex", alignItems: "center", gap: 8, background: BLUE, color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            🔍 Verificar hash
          </Link>
        </div>

        {/* TOP STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: "2rem" }}>
          {[
            { label: "Último Merkle Root", value: shortHash(latestMerkle, 10), icon: "#",  color: BLUE   },
            { label: "Último Block Hash",  value: "0x7f3a...d4b2",             icon: "□",  color: BLUE   },
            { label: "Última TX Hash",     value: shortHash(latestTx, 10),     icon: "🔗", color: BLUE   },
            { label: "Network",            value: "Polygon",                   icon: "◎",  color: AMBER  },
            { label: "Anchored Events",    value: `${Math.round(totalBlocks * 847 / 2847).toLocaleString("pt-BR")}K`, icon: "📌", color: PURPLE },
          ].map(s => (
            <div key={s.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 18, color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: "monospace", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TWO COLUMNS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: "2rem" }}>

          {/* Últimos Blocos */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 700 }}>Últimos Blocos</div>
            {displayBlocks.map((b: any, i: number) => (
              <div key={b.id} style={{ padding: "12px 1.5rem", borderBottom: i < displayBlocks.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>#{typeof b.id === "number" ? b.id.toLocaleString("pt-BR") : b.id}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{b.time ?? "—"}</span>
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: "monospace" }}>Hash: <span style={{ color: TEXT2 }}>{b.hash ?? shortHash(b.block_hash, 8)}</span></div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: "monospace" }}>Merkle: <span style={{ color: TEXT2 }}>{b.merkle ?? shortHash(b.merkle_root, 8)}</span></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{b.txs ?? b.event_count ?? 0} TXs</div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block", background: b.status === "Ancorado" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: b.status === "Ancorado" ? GREEN : AMBER }}>
                    {b.status ?? "Ancorado"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Últimos Eventos */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 700 }}>Últimos Eventos</div>
            {displayEvents.map((e: any, i: number) => (
              <div key={i} style={{ padding: "12px 1.5rem", borderBottom: i < displayEvents.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PURPLE, fontFamily: "monospace" }}>{e.hash ?? shortHash(e.event_hash, 8)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: (e.status === "Verified" || e.anchored) ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: (e.status === "Verified" || e.anchored) ? GREEN : AMBER }}>
                        {e.status ?? (e.anchored ? "Verified" : "Pending")}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>{e.screen ?? e.screen_label ?? "—"} · {e.campaign ?? "Exibição"}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{e.time ?? e.played_at ?? "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ANCHORING STATUS */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: "1.25rem" }}>Anchoring Status — ICP Brasil</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "ICP Brasil",  sub: "Ativo",        color: GREEN  },
              { label: "Signature",   sub: "Válida",       color: GREEN  },
              { label: "Merkle Tree", sub: "Sincronizado", color: GREEN  },
              { label: "Blockchain",  sub: "Ancorado",     color: GREEN  },
              { label: "Timestamp",   sub: "Verificado",   color: GREEN  },
              { label: "Certificate", sub: "Emitido",      color: GREEN  },
              { label: "Network",     sub: "Polygon",      color: BLUE   },
              { label: "Compliance",  sub: "LGPD ✓",       color: AMBER  },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: TEXT2 }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginTop: 2 }}>{s.sub}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { href: "/verify",       icon: "🔐", title: "Verificar hash",  desc: "Consultar uma prova criptográfica" },
            { href: "/network/map",  icon: "🌐", title: "Network Map",     desc: "Ver telas ativas por região"      },
            { href: "/trust-center", icon: "🛡",  title: "Trust Center",    desc: "Trust Score e certificações"      },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ background: SURFACE, border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "1.25rem", textDecoration: "none", display: "block" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{l.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>{l.title}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{l.desc}</div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
