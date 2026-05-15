import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

interface DigitalChartProps {
  data: { t: number; value: number }[];
  isSimulating: boolean;
}

export default function DigitalChart({ data, isSimulating }: DigitalChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a3a3a" opacity={0.3} />
          <XAxis
            dataKey="t"
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            label={{ value: "Tiempo (s)", position: "insideBottom", offset: -10, fill: "#6b7280", fontSize: 11 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            label={{ value: "Amplitud (V)", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }}
          />
          <Bar dataKey="value" isAnimationActive={isSimulating}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? "#8b5cf6" : "#ec4899"}
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
