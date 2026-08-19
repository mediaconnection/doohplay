"use client"

import { useEffect, useState } from "react"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

type SlaPoint = {
  date: string
  sla: number
}

type SlaHistoryResponse = {
  history?: SlaPoint[]
}

export default function SlaRanking() {
  const [data, setData] = useState<SlaPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/players/sla-real-history", {
          cache: "no-store",
          signal: controller.signal
        })

        if (!res.ok) {
          throw new Error(`SLA_HISTORY_FETCH_FAILED_${res.status}`)
        }

        const json = (await res.json().catch(() => null)) as SlaHistoryResponse | null

        setData(Array.isArray(json?.history) ? json.history : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        console.error("SLA_RANKING_ERROR", err)
        setError("Falha ao carregar SLA histórico")
        setData([])
      } finally {
        setLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [])

  return (
    <div className="rounded-2xl bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-6 text-xl font-semibold">
        📈 SLA Real – Últimos 7 Dias
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando gráfico...</p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!loading && !error ? (
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis domain={[90, 100]} stroke="#888" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sla"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}