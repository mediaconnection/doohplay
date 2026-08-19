"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = {
  campaign: string;
  executions: number;
};

type Props = {
  startDate: string;
  endDate: string;
};

export default function CampaignsChart({ startDate, endDate }: Props) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function load() {
      const { data, error } = await supabase.rpc(
        "dashboard_executions_by_campaign",
        {
          start_date: startDate,
          end_date: endDate,
        }
      );

      if (!mounted) return;

      if (error) {
        console.error("Erro ao carregar campanhas:", error);
        setData([]);
      } else if (Array.isArray(data)) {
        setData(data as Row[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="h-80 bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-center text-sm text-gray-400">
        Carregando campanhas…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-center text-sm text-gray-400">
        Sem dados no período
      </div>
    );
  }

  return (
    <div className="h-80 bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h2 className="font-semibold mb-4 text-gray-300">
        Execuções por Campanha
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="campaign" stroke="#9CA3AF" />
          <YAxis allowDecimals={false} stroke="#9CA3AF" />
          <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} />
          <Bar dataKey="executions" fill="#6366F1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
