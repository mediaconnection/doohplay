"use client";

type Period = "today" | "7d" | "30d";

type Props = {
  value: Period;
  onChange: (value: Period) => void;
};

export default function PeriodFilter({ value, onChange }: Props) {
  const base =
    "px-3 py-1 rounded-full text-sm border transition";
  const active =
    "bg-black text-white border-black";
  const inactive =
    "bg-white text-gray-600 hover:bg-gray-100";

  return (
    <div className="flex gap-2">
      <button
        className={`${base} ${value === "today" ? active : inactive}`}
        onClick={() => onChange("today")}
      >
        Hoje
      </button>

      <button
        className={`${base} ${value === "7d" ? active : inactive}`}
        onClick={() => onChange("7d")}
      >
        7 dias
      </button>

      <button
        className={`${base} ${value === "30d" ? active : inactive}`}
        onClick={() => onChange("30d")}
      >
        30 dias
      </button>
    </div>
  );
}
