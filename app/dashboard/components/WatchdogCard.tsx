"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type StatusResponse = {
  total: number
  online: number
  offline: number
  percentageOnline: number
  checkedAt: string
}

type OfflinePlayer = {
  id: string
  ip_address?: string
  version?: string
  last_seen?: string
  secondsOffline: number
  offlineFormatted: string
}

function clampPercent(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

async function fetchJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { cache: "no-store", signal })
  if (!res.ok) throw new Error(`${url} failed with ${res.status}`)
  return res.json()
}

export default function WatchdogCard() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [offlineList, setOfflineList] = useState<OfflinePlayer[]>([])
  const [sla, setSla] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const mountedRef = useRef(false)

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [statusJson, offlineJson, slaJson] = await Promise.all([
        fetchJson("/api/players/status", signal),
        fetchJson("/api/events/offline", signal),
        fetchJson("/api/players/sla-real-daily", signal)
      ])

      if (!mountedRef.current || signal?.aborted) return

      setStatus({
        total: Number(statusJson.total ?? 0),
        online: Number(statusJson.online ?? 0),
        offline: Number(statusJson.offline ?? 0),
        percentageOnline: clampPercent(statusJson.percentageOnline),
        checkedAt: String(statusJson.checkedAt ?? new Date().toISOString())
      })

      setOfflineList(Array.isArray(offlineJson.players) ? offlineJson.players : [])

      setSla(
        typeof slaJson.slaPercentage === "number" && Number.isFinite(slaJson.slaPercentage)
          ? Number(slaJson.slaPercentage.toFixed(2))
          : null
      )

      setError(null)
    } catch (err) {
      if (signal?.aborted) return
      console.error("WATCHDOG_LOAD_ERROR", err)

      if (mountedRef.current) {
        setError("Falha ao carregar dados do Watchdog")
      }
    }
  }, [])

  async function forceCheck() {
    try {
      setChecking(true)

      const res = await fetch("/api/events/players/check-offline", {
        method: "POST"
      })

      if (!res.ok) throw new Error("Falha ao forçar verificação")

      await loadData()
    } catch (err) {
      console.error("WATCHDOG_FORCE_CHECK_ERROR", err)
      setError("Erro ao forçar verificação")
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    const controller = new AbortController()

    void loadData(controller.signal)

    const interval = window.setInterval(() => {
      void loadData(controller.signal)
    }, 10_000)

    return () => {
      mountedRef.current = false
      controller.abort()
      window.clearInterval(interval)
    }
  }, [loadData])

  if (error) {
    return (
      <div className="rounded-2xl bg-gray-900 p-6 text-red-400">
        ⚠ {error}
      </div>
    )
  }

  if (!status) {
    return (
      <div className="rounded-2xl bg-gray-900 p-6">
        Carregando Watchdog...
      </div>
    )
  }

  const percentage = clampPercent(status.percentageOnline)

  const healthColor =
    percentage < 80 ? "bg-red-600" : percentage < 95 ? "bg-yellow-500" : "bg-green-500"

  const textColor =
    percentage < 80 ? "text-red-400" : percentage < 95 ? "text-yellow-400" : "text-green-400"

  return (
    <div className="rounded-2xl bg-gray-900 p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">🛡 Watchdog</h2>

        <button
          type="button"
          onClick={forceCheck}
          disabled={checking}
          className={`rounded-lg px-3 py-2 text-xs transition ${
            checking
              ? "cursor-not-allowed bg-gray-700 text-gray-400"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {checking ? "Verificando..." : "Forçar verificação"}
        </button>
      </div>

      {sla !== null && (
        <div className="mb-6 rounded-xl border border-indigo-600 bg-indigo-900/40 p-4">
          <p className="text-xs text-gray-300">SLA Real Hoje</p>
          <p className="text-2xl font-bold text-indigo-400">{sla.toFixed(2)}%</p>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>Status Geral</span>
          <span className={`font-bold ${textColor}`}>{percentage.toFixed(2)}%</span>
        </div>

        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={`${healthColor} h-4 transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-green-700/40 p-4">
          <p className="text-xs text-gray-300">Online</p>
          <p className="text-2xl font-bold">{status.online}</p>
        </div>

        <div className="rounded-xl bg-red-700/40 p-4">
          <p className="text-xs text-gray-300">Offline</p>
          <p className="text-2xl font-bold">{status.offline}</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-gray-500">
        Última verificação:{" "}
        {status.checkedAt
          ? new Date(status.checkedAt).toLocaleTimeString("pt-BR")
          : "—"}
      </p>

      {percentage < 95 && (
        <div className="mb-6 rounded-lg border border-red-600 bg-red-900/40 p-3 text-sm text-red-300">
          ⚠ Atenção: Existem players offline.
        </div>
      )}

      {offlineList.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-red-400">Players Offline</h3>
            <span className="text-xs text-gray-500">{offlineList.length} afetado(s)</span>
          </div>

          <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
            {offlineList.map((player) => {
              const minutes = Math.floor(Number(player.secondsOffline ?? 0) / 60)

              const severityColor =
                minutes > 30
                  ? "border-red-600"
                  : minutes > 10
                    ? "border-orange-500"
                    : "border-yellow-500"

              return (
                <div
                  key={player.id}
                  className={`rounded-xl border-l-4 bg-gray-800 p-4 ${severityColor}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate font-mono text-xs text-gray-300">
                      {player.id}
                    </p>
                    <span className="text-xs font-semibold text-red-400">
                      {player.offlineFormatted || `${minutes} min`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <p>IP: {player.ip_address || "—"}</p>
                    <p>Versão: {player.version || "—"}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}