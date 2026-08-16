"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import VerifiedBadge from "@/lib/ui/VerifiedBadge"

/* =========================
   CONSTANTS
========================= */

const STORAGE_KEY = "doohplay_history"
const MAX_HISTORY = 5
const DEMO_HASH =
  "2a09297fa6bfb9ead0ad904b0a2472782cff9049521682b7f9ac411c8a3ff464"

/* =========================
   HELPERS
========================= */

function normalizeHash(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, "")
}

function formatHash0x(value: string): string {
  const normalized = normalizeHash(value)
  return normalized ? `0x${normalized}` : ""
}

function isValidHash(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(normalizeHash(value))
}

function getValidationMessage(value: string): string | null {
  const normalized = normalizeHash(value)

  if (!normalized) {
    return "Informe um hash SHA-256 para iniciar a verificação."
  }

  if (!/^[a-f0-9]+$/i.test(normalized)) {
    return "O hash deve conter apenas caracteres hexadecimais."
  }

  if (normalized.length !== 64) {
    return "O hash precisa ter exatamente 64 caracteres hexadecimais."
  }

  return null
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function canUseClipboard(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.clipboard
  )
}

function safeLoadHistory(): string[] {
  if (!canUseStorage()) return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalizeHash)
      .filter(isValidHash)
      .slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

function safeSaveHistory(items: string[]) {
  if (!canUseStorage()) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // noop
  }
}

function safeClearHistoryStorage() {
  if (!canUseStorage()) return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}

function shortHash(hash: string): string {
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`
}

/* =========================
   PAGE
========================= */

export default function VerifyPage() {
  const router = useRouter()

  const [hash, setHash] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [history, setHistory] = useState<string[]>([])

  const normalizedHash = useMemo(() => normalizeHash(hash), [hash])
  const formattedHash = useMemo(() => formatHash0x(hash), [hash])
  const hasValue = normalizedHash.length > 0
  const hashIsValid = useMemo(() => isValidHash(hash), [hash])
  const validationMessage = useMemo(() => getValidationMessage(hash), [hash])
  const recentItems = useMemo(() => history.slice(0, MAX_HISTORY), [history])

  useEffect(() => {
    setHistory(safeLoadHistory())
  }, [])

  function saveToHistory(value: string) {
    const normalized = normalizeHash(value)

    setHistory((current) => {
      const updated = [
        normalized,
        ...current.filter((item) => item !== normalized)
      ].slice(0, MAX_HISTORY)

      safeSaveHistory(updated)
      return updated
    })
  }

  function goToVerify(targetHash: string) {
    router.push(`/verify/${normalizeHash(targetHash)}`)
  }

  function handleVerify(value?: string) {
    const target = normalizeHash(value ?? hash)
    setTouched(true)

    if (!target) {
      setInfo("")
      setError("Informe um hash para continuar.")
      return
    }

    if (!isValidHash(target)) {
      setInfo("")
      setError(
        "Hash inválido. Informe um SHA-256 com 64 caracteres hexadecimais."
      )
      return
    }

    setError("")
    setInfo("")
    saveToHistory(target)
    goToVerify(target)
  }

  async function pasteFromClipboard() {
    if (!canUseClipboard()) {
      setInfo("")
      setError("A área de transferência não está disponível neste navegador.")
      return
    }

    try {
      const text = await navigator.clipboard.readText()
      const normalized = normalizeHash(text)
      setTouched(true)

      if (!normalized) {
        setInfo("")
        setError("A área de transferência está vazia.")
        return
      }

      setHash(normalized)

      if (!isValidHash(normalized)) {
        setInfo("")
        setError("O conteúdo colado não é um hash SHA-256 válido.")
        return
      }

      setError("")
      setInfo("Hash colado com sucesso.")
    } catch {
      setInfo("")
      setError("Não foi possível acessar a área de transferência.")
    }
  }

  function useDemo() {
    setHash(DEMO_HASH)
    setTouched(true)
    setError("")
    setInfo("Hash de demonstração preenchido com um exemplo válido.")
  }

  function clearHistory() {
    setHistory([])
    safeClearHistoryStorage()
    setError("")
    setInfo("")
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              DOOH<span className="text-blue-600">PLAY</span>
            </span>
          </Link>
          <Link href="/trust-center" className="text-xs font-medium text-slate-500 hover:text-slate-800">
            Trust Center
          </Link>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <VerifiedBadge valid size="lg" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  DOOHPLAY Verify Enterprise
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Verificação criptográfica pública
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
              Consulte eventos, provas criptográficas, evidências de integridade,
              Merkle root, consistência cross-layer, âncoras blockchain e
              metadados de auditoria informando um hash SHA-256 do ecossistema
              DOOHPLAY.
            </p>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Hash SHA-256 para verificação
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Cole um hash com ou sem prefixo 0x para abrir a prova pública.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Escopo
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    ICP • Merkle • Blockchain
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleVerify()
                }}
                className="mt-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row">
                  <input
                    value={hash}
                    onChange={(e) => {
                      setHash(e.target.value)
                      if (error) setError("")
                      if (info) setInfo("")
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="Cole o hash SHA-256 (64 hex, com ou sem 0x)..."
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    inputMode="text"
                    aria-label="Hash SHA-256 para verificação"
                    className={[
                      "flex-1 rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400",
                      touched && hasValue && !hashIsValid
                        ? "border-rose-300 ring-2 ring-rose-100"
                        : "border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    ].join(" ")}
                  />

                  <button
                    type="submit"
                    disabled={!hasValue || !hashIsValid}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verificar prova
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div
                    className={[
                      "text-sm",
                      touched && hasValue && !hashIsValid
                        ? "text-rose-700"
                        : "text-slate-500"
                    ].join(" ")}
                  >
                    {error
                      ? error
                      : info
                        ? info
                        : touched || hasValue
                          ? validationMessage
                          : "Formato esperado: 64 caracteres hexadecimais. Prefixo 0x é aceito."}
                  </div>

                  <div className="text-xs text-slate-500">
                    {normalizedHash.length}/64 caracteres
                  </div>
                </div>
              </form>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="rounded-2xl bg-slate-950 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pré-visualização do hash normalizado
                </div>
                <code className="mt-3 block break-all text-sm text-slate-100">
                  {formattedHash || "0x"}
                </code>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  O hash será normalizado para comparação pública, preservando o
                  valor criptográfico e removendo diferenças apenas cosméticas.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 md:flex-col">
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Colar da área de transferência
                </button>

                <button
                  type="button"
                  onClick={useDemo}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Usar hash demo
                </button>

                <Link
                  href={`/verify/${DEMO_HASH}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Abrir exemplo pronto
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <InfoCard
                title="Verificação pública"
                text="Abra a prova de um evento específico a partir do hash."
              />
              <InfoCard
                title="Integridade"
                text="Consulte assinatura, Merkle, cadeia histórica e evidências auxiliares."
              />
              <InfoCard
                title="Blockchain"
                text="Valide a âncora pública, metadados técnicos e links para o explorer."
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recentes
                </h2>

                {recentItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Limpar histórico
                  </button>
                ) : null}
              </div>

              {recentItems.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {recentItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setError("")
                        setInfo("")
                        saveToHistory(item)
                        goToVerify(item)
                      }}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="text-xs font-medium text-slate-500">
                        Hash verificado
                      </div>
                      <div className="mt-1 font-mono text-sm text-slate-800">
                        {shortHash(item)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Nenhuma verificação recente encontrada neste navegador.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Como funciona
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  Cole o hash de um evento ou certificado emitido pelo DOOHPLAY.
                </p>
                <p>
                  A plataforma abrirá a página pública de prova em{" "}
                  <span className="font-mono text-slate-800">/verify/[hash]</span>.
                </p>
                <p>
                  Lá você verá status, confiança, evidências criptográficas,
                  Merkle, blockchain e auditoria técnica consolidada.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Exemplo aceito
              </h2>

              <div className="mt-4 rounded-2xl bg-slate-100 p-4 font-mono text-xs break-all text-slate-700">
                {DEMO_HASH}
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DOOHPLAY
        </div>
      </div>
    </main>
  )
}

/* =========================
   COMPONENTS
========================= */

function InfoCard({
  title,
  text
}: {
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  )
}