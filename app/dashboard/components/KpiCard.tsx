import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
};

export default function KpiCard({ title, value, icon }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
      {icon && (
        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
      )}

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
