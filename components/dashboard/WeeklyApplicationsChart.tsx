"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WeeklyApplicationsChart() {
  const data = useMemo(() => [
    { name: "Week 1", count: 12 },
    { name: "Week 2", count: 19 },
    { name: "Week 3", count: 15 },
    { name: "Week 4", count: 28 },
    { name: "Week 5", count: 22 },
    { name: "Week 6", count: 45 },
    { name: "Week 7", count: 38 },
  ], []);

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-primary">
          Weekly Applications
        </h3>
        <p className="text-xs text-text-secondary">
          Applications received over the last 7 weeks.
        </p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#17C6B5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#17C6B5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fill: "#6D7A92", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6D7A92", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B1F3A",
                color: "#FFF",
                borderRadius: "12px",
                border: "none",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#17C6B5" }}
            />
            <Area type="monotone" dataKey="count" stroke="#17C6B5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
