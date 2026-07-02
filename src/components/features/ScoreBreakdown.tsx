import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { ScoreBreakdown as ScoreBreakdownItem } from "../../types";

interface ScoreBreakdownProps {
  data: ScoreBreakdownItem[];
}

export function ScoreBreakdown({ data }: ScoreBreakdownProps) {
  const chartData = data.map((d) => ({ axis: d.axis, score: d.score }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#27272A" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#A1A1AA", fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={4}
          />
          <Radar
            dataKey="score"
            stroke="#818CF8"
            fill="#6366F1"
            fillOpacity={0.28}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
