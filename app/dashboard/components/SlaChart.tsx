"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SlaPoint {
  date: string;
  sla: number;
}

export default function SlaChart() {
  const [data, setData] = useState<SlaPoint[]>([]);

  useEffect(() => {
    fetch("/api/players/sla-history")
      .then((res) => res.json())
      .then((json) => setData(json.history || []))
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 bg-gray-900 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold mb-6">
        📈 SLA Últimos 7 Dias
      </h2>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" stroke="#888" />
            <YAxis domain={[0, 100]} stroke="#888" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sla"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
