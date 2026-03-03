"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

type EdPlateProps = {
  prot: number;
  carb: number;
  fat: number;
};

const CATEGORIES = [
  { name: "Protéines", color: "#EF4444" },
  { name: "Glucides", color: "#EAB308" },
  { name: "Lipides", color: "#F97316" },
];

export default function EdPlate({ prot, carb, fat }: EdPlateProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const values = [prot * 4, carb * 4, fat * 9];
  const hasData = values.some((v) => v > 0);

  const data = CATEGORIES.map((c, i) => ({
    name: c.name,
    value: values[i],
    color: c.color,
  })).filter((d) => d.value > 0);

  if (!mounted) {
    return (
      <div className="w-[130px] h-[130px] rounded-full bg-gray-100 mx-auto" />
    );
  }

  if (!hasData) {
    return (
      <div className="w-[130px] h-[130px] rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mx-auto bg-gray-50">
        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-3">
          Ajoute ton
          <br />
          premier repas
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/* White ring to give "plate" look */}
      <div className="rounded-full ring-4 ring-white shadow-md shadow-gray-200">
        <PieChart width={130} height={130}>
          <Pie
            data={data}
            cx={65}
            cy={65}
            outerRadius={62}
            dataKey="value"
            strokeWidth={2}
            stroke="white"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </div>
    </div>
  );
}
