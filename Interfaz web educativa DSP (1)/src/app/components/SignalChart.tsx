import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart } from "recharts";

interface SignalChartProps {
  data: { t: number; value: number }[];
  sampledData: { t: number; value: number }[];
  isSimulating: boolean;
}

export default function SignalChart({ data, sampledData, isSimulating }: SignalChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#colorGradient)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={isSimulating}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>

      {/* Overlay sample points */}
      <div className="absolute inset-0 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <XAxis dataKey="t" type="number" domain={[0, 2]} hide />
            <YAxis dataKey="value" type="number" domain={[-2, 2]} hide />
            <Scatter
              data={sampledData}
              fill="#fbbf24"
              fillOpacity={0.8}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
