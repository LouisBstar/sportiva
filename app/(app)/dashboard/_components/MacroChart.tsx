"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

type MacroChartProps = {
  consumed: { prot: number; carb: number; fat: number };
  target: { prot: number; carb: number; fat: number };
};

const MACROS = [
  { key: "prot" as const, name: "Protéines", cal: 4, color: "#1A73E8" },
  { key: "carb" as const, name: "Glucides", cal: 4, color: "#34A853" },
  { key: "fat" as const, name: "Lipides", cal: 9, color: "#E65100" },
];

export default function MacroChart({ consumed, target }: MacroChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalCal =
    consumed.prot * 4 + consumed.carb * 4 + consumed.fat * 9;
  const hasData = totalCal > 0;

  const data = MACROS.map((m) => ({
    name: m.name,
    value: consumed[m.key] * m.cal,
    grams: consumed[m.key],
    target: target[m.key],
    color: m.color,
  }));

  return (
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div className="flex-shrink-0">
        {mounted && hasData ? (
          <PieChart width={108} height={108}>
            <Pie
              data={data}
              cx={54}
              cy={54}
              innerRadius={33}
              outerRadius={51}
              dataKey="value"
              startAngle={90}
              endAngle={450}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <div className="w-[108px] h-[108px] rounded-full border-[6px] border-dashed border-gray-100 flex items-center justify-center">
            <span className="text-[10px] text-gray-300 text-center leading-tight">
              Aucun
              <br />
              repas
            </span>
          </div>
        )}
      </div>

      {/* Progress bars */}
      <div className="flex-1 space-y-2.5">
        {data.map((m) => {
          const pct =
            m.target > 0
              ? Math.min((m.grams / m.target) * 100, 100)
              : 0;
          return (
            <div key={m.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-xs text-gray-500">{m.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  <span
                    className="font-semibold"
                    style={{ color: m.color }}
                  >
                    {m.grams}
                  </span>
                  /{m.target}g
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: m.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
