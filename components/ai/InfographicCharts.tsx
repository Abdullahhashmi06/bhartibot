"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RadarChartProps {
  data?: { subject: string; score: number }[];
}

export function RadarChartWidget({
  data = [
    { subject: "Technical", score: 85 },
    { subject: "Projects", score: 90 },
    { subject: "Experience", score: 70 },
    { subject: "Education", score: 80 },
    { subject: "Communication", score: 75 },
    { subject: "Domain Fit", score: 88 },
  ],
}: RadarChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#CBD5E1" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#6D7A92", fontSize: 11, fontFamily: "Inter" }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" />
          <Radar
            name="Candidate Fit"
            dataKey="score"
            stroke="#17C6B5"
            fill="#17C6B5"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  data?: { category: string; value: number }[];
}

export function RequirementBarChart({
  data = [
    { category: "Core Tech", value: 92 },
    { category: "Frameworks", value: 85 },
    { category: "Problem Solving", value: 78 },
    { category: "Soft Skills", value: 88 },
  ],
}: BarChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="category"
            tick={{ fill: "#6D7A92", fontSize: 11 }}
            axisLine={{ stroke: "#E2E8F0" }}
          />
          <YAxis domain={[0, 100]} tick={{ fill: "#6D7A92", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B1F3A",
              color: "#FFF",
              borderRadius: "12px",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" fill="#6F52ED" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps {
  data?: { name: string; value: number }[];
}

export function DistributionPieChart({
  data = [
    { name: "Technical Match", value: 45 },
    { name: "Education", value: 25 },
    { name: "Soft Skills", value: 20 },
    { name: "Gaps", value: 10 },
  ],
}: PieChartProps) {
  const COLORS = ["#17C6B5", "#6F52ED", "#29D391", "#EF4444"];

  return (
    <div className="h-56 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
