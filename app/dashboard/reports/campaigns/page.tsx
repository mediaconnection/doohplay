export const dynamic = "force-dynamic"

import { pool } from "@/lib/db"

type CampaignOption = {
  id: string
  name: string
}

type CampaignReportRow = {
  campaign_id: string
  campaign_name: string
  executions_done: string | number
  total_seconds: string | number
  cpm: string | number
  gross_amount: string | number
}

type CampaignReport = {
  campaign_id: string
  campaign_name: string
  executions_done: number
  total_seconds: number
  cpm: number
  gross_amount: number
}

type SearchParams = {
  period?: string
  campaign?: string
}

function resolvePeriod(period?: string) {
  const end = new Date()
  const start = new Date(end)

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0)
      break
    case "7d":
      start.setDate(end.getDate() - 7)
      break
    case "30d":
    default:
      start.setDate(end.getDate() - 30)
      break
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

async function getCampaignOptions(): Promise<CampaignOption[]> {
  const result = await pool.query(`
    SELECT
      id::text AS id,
      name
    FROM public.campaigns
    ORDER BY name ASC
  `)

  return result.rows as CampaignOption[]
}

async function getCampaignReports(
  period?: string,
  campaignId?: string
): Promise<CampaignReport[]> {
  const { start, end } = resolvePeriod(period)

  const result = await pool.query(
    `
    SELECT
      c.id::text AS campaign_id,
      c.name AS campaign_name,
      COUNT(pl.id) AS executions_done,
      COALESCE(SUM(pl.duration_seconds), 0) AS total_seconds,
      25.00::numeric AS cpm,
      ROUND((COUNT(pl.id)::numeric / 1000) * 25.00, 2) AS gross_amount
    FROM public.campaigns c
    LEFT JOIN public.play_logs_certified pl
      ON pl.campaign_id = c.id
     AND pl.created_at >= $1
     AND pl.created_at <  $2
    WHERE ($3::uuid IS NULL OR c.id = $3::uuid)
    GROUP BY c.id, c.name
    ORDER BY c.name ASC
    `,
    [start, end, campaignId ?? null]
  )

  const rows = result.rows as CampaignReportRow[]

  return rows.map((row) => ({
    campaign_id: row.campaign_id,
    campaign_name: row.campaign_name,
    executions_done: toNumber(row.executions_done),
    total_seconds: toNumber(row.total_seconds),
    cpm: toNumber(row.cpm),
    gross_amount: toNumber(row.gross_amount)
  }))
}

export default async function CampaignReportsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const campaigns = await getCampaignOptions()
  const data = await getCampaignReports(params.period, params.campaign)

  const totalExecutions = data.reduce(
    (sum, row) => sum + row.executions_done,
    0
  )

  const totalSeconds = data.reduce(
    (sum, row) => sum + row.total_seconds,
    0
  )

  const totalGross = data.reduce(
    (sum, row) => sum + row.gross_amount,
    0
  )

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">📊 Relatório de Campanhas</h1>
      {/* Achado na varredura ampla de 17/08/2026 (docs/achado-cpm-fixo-relatorio-financeiro.md):
          o valor abaixo usa um CPM fixo de R$25 hardcoded na query, sem relação com o preço
          real cobrado por campanha. Confirmado com o fundador que esta tela não alimenta
          contabilidade real (é um relatório interno/legado) — por isso rotulado como
          "estimado" em vez de removido. */}
      <p className="text-sm text-gray-500">
        Valor calculado com CPM fixo de referência (R$25) — é uma estimativa interna, não o preço real cobrado por campanha.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <FilterButton label="Hoje" period="today" campaign={params.campaign} />
        <FilterButton label="7 dias" period="7d" campaign={params.campaign} />
        <FilterButton label="30 dias" period="30d" campaign={params.campaign} />

        <form method="GET" className="flex gap-2">
          <input type="hidden" name="period" value={params.period ?? ""} />

          <select
            name="campaign"
            defaultValue={params.campaign ?? ""}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">Todas as campanhas</option>

            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
          >
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi title="Execuções" value={totalExecutions} />
        <Kpi title="Tempo (s)" value={totalSeconds} />
        <Kpi title="Valor estimado (R$)" value={totalGross.toFixed(2)} />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Campanha</th>
              <th className="p-3 text-right">Execuções</th>
              <th className="p-3 text-right">Tempo (s)</th>
              <th className="p-3 text-right">Valor estimado (R$)</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.campaign_id} className="border-t">
                <td className="p-3">{row.campaign_name}</td>
                <td className="p-3 text-right">{row.executions_done}</td>
                <td className="p-3 text-right">{row.total_seconds}</td>
                <td className="p-3 text-right">{row.gross_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-black p-4 text-white">
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function FilterButton({
  label,
  period,
  campaign
}: {
  label: string
  period: string
  campaign?: string
}) {
  const params = new URLSearchParams()

  params.set("period", period)

  if (campaign) {
    params.set("campaign", campaign)
  }

  return (
    <a
      href={`?${params.toString()}`}
      className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
    >
      {label}
    </a>
  )
}