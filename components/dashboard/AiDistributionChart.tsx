"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AiDistributionChartProps {
  distribution: {
    excellent: number;
    good: number;
    average: number;
    weak: number;
  };
}

export default function AiDistributionChart({ distribution }: AiDistributionChartProps) {
  const data = [
    { name: "Excellent", value: distribution.excellent },
    { name: "Good", value: distribution.good },
    { name: "Average", value: distribution.average },
    { name: "Weak", value: distribution.weak },
  ].filter(d => d.value > 0);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Fallback if no data
  if (total === 0) {
    data.push({ name: "No Data", value: 1 });
  }

  const COLORS = {
    "Excellent": "#29D391",
    "Good": "#17C6B5",
    "Average": "#F59E0B",
    "Weak": "#EF4444",
    "No Data": "#E2E8F0"
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-primary">
          AI Score Distribution
        </h3>
        <p className="text-xs text-text-secondary">
          Breakdown of candidates by AI match tier.
        </p>
      </div>
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B1F3A",
                color: "#FFF",
                borderRadius: "12px",
                border: "none",
                fontSize: "12px",
              }}
              formatter={(value: any) => total === 0 ? "0" : value}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-8">
            <span className="font-display font-extrabold text-3xl text-primary">{total}</span>
            <span className="text-[10px] uppercase font-bold text-text-muted">Analyzed</span>
          </div>
        )}
      </div>
    </div>
  );
}
