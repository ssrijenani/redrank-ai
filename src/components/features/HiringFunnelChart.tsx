import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FunnelStage } from "../../types";

interface HiringFunnelChartProps {
  data: FunnelStage[];
}

const COLORS = ["#818CF8", "#6366F1", "#4F46E5", "#8B5CF6", "#10B981"];

export function HiringFunnelChart({ data }: HiringFunnelChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#71717A", fontSize: 11 }} axisLine={{ stroke: "#27272A" }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: "#A1A1AA", fontSize: 11.5 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: "#18181B",
              border: "1px solid #27272A",
              borderRadius: 8,
              fontSize: 12,
              color: "#FAFAFA",
            }}
            cursor={{ fill: "#ffffff08" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
