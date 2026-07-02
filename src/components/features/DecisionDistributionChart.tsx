import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DistributionBucket } from "../../types";

interface DecisionDistributionChartProps {
  data: DistributionBucket[];
}

const COLORS: Record<string, string> = {
  "Pending Review": "#71717A",
  Shortlisted: "#10B981",
  "Needs Review": "#F59E0B",
  Rejected: "#F43F5E",
};

export function DecisionDistributionChart({ data }: DecisionDistributionChartProps) {
  const nonZero = data.filter((d) => d.count > 0);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="count"
            nameKey="label"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {nonZero.map((d) => (
              <Cell key={d.label} fill={COLORS[d.label] ?? "#6366F1"} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#18181B",
              border: "1px solid #27272A",
              borderRadius: 8,
              fontSize: 12,
              color: "#FAFAFA",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            iconSize={7}
            formatter={(value) => <span className="text-[11.5px] text-text-secondary">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
