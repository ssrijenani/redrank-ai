import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DistributionBarChartProps {
  data: { label: string; count: number }[];
  color?: string;
}

export function DistributionBarChart({ data, color = "#6366F1" }: DistributionBarChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -12, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#A1A1AA", fontSize: 11 }} axisLine={{ stroke: "#27272A" }} tickLine={false} />
          <YAxis tick={{ fill: "#71717A", fontSize: 11 }} axisLine={false} tickLine={false} />
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
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
