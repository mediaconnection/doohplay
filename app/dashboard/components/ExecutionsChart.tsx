"use client"

import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import { createClient } from "../../../lib/supabase/client"
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh"

const supabase = createClient()

type Row = {
  period: string
  executions: number
}

type Props = {
  startDate: string
  endDate: string
}

function formatDateLabel(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  })
}

function formatTick(value: string | number): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatTooltipLabel(label: ReactNode): ReactNode {
  return formatDateLabel(label)
}

export default function ExecutionsChart({ startDate, endDate }: Props) {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExecutions = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true)
        setError(null)

        const { data: rows, error: rpcError } = await supabase.rpc(
          "dashboard_executions_over_time",
          {
            start_date: startDate,
            end_date: endDate
          }
        )

        if (rpcError) throw rpcError

        setData(Array.isArray(rows) ? (rows as Row[]) : [])
      } catch (err) {
        console.error("EXECUTIONS_CHART_ERROR", err)
        setError("Erro ao carregar execuções")
        setData([])
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [startDate, endDate]
  )

  useEffect(() => {
    void fetchExecutions()
  }, [fetchExecutions])

  useAutoRefresh(() => {
    void fetchExecutions(true)
  }, 15000)

  if (loading) {
    return (
      <div className="h-80 animate-pulse rounded-xl border border-gray-800 bg-gray-900 p-4" />
    )
  }

  if (error) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-gray-400">
        Sem dados no período
      </div>
    )
  }

  return (
    <div className="h-80 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-4 font-semibold text-gray-300">
        Execuções ao longo do tempo
      </h2>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis
            dataKey="period"
            tickFormatter={formatTick}
            minTickGap={20}
            stroke="#9CA3AF"
          />

          <YAxis allowDecimals={false} stroke="#9CA3AF" />

          <Tooltip
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151"
            }}
          />

          <Line
            type="monotone"
            dataKey="executions"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
