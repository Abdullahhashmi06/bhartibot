"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WeeklyApplicationsChartProps {
  /** Real weekly application counts (oldest → newest), from getDashboardAnalytics. */
  data: { name: string; count: number }[];
}

export default function WeeklyApplicationsChart({ data }: WeeklyApplicationsChartProps) {
  const chartData = useMemo(
    () =>
      data && data.length > 0
        ? data
        : [
            { name: "No data", count: 0 },
            { name: "No data", count: 0 },
          ],
    [data]
  );
  const hasData = data && data.length > 0;

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
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-text-secondary">No applications yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
