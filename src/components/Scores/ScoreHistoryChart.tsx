import { Score } from "../../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDateShort } from "../../lib/utils";

interface ScoreHistoryChartProps {
  scores: Score[];
}

export default function ScoreHistoryChart({ scores }: ScoreHistoryChartProps) {
  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No scores recorded yet</p>
      </div>
    );
  }

  // Reverse to show chronological order
  const chartData = [...scores].reverse().map((score) => ({
    date: formatDateShort(score.recorded_at),
    timestamp: score.recorded_at,
    score: score.value,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [`${value}/10`, "Score"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

