import { useMemo } from "react";
import { LifeArea, Score } from "../../types";
import { formatDateShort } from "../../lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ScoreList from "./ScoreList";

interface ScoreChartSectionProps {
  area: LifeArea;
  scores: Score[];
}

export default function ScoreChartSection({
  area,
  scores,
}: ScoreChartSectionProps) {
  const chartData = useMemo(() => {
    if (scores.length === 0) return [];

    return [...scores]
      .reverse()
      .map((score) => ({
        date: formatDateShort(score.recorded_at),
        timestamp: score.recorded_at,
        score: score.value,
      }));
  }, [scores]);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: area.color }}
        />
        <h2 className="text-xl font-semibold text-gray-900">
          {area.name} - Score Evolution
        </h2>
      </div>

      {chartData.length > 0 ? (
        <div className="w-full h-80">
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
                stroke={area.color}
                strokeWidth={2}
                dot={{ r: 4, fill: area.color }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No scores recorded for this area yet</p>
        </div>
      )}

      <ScoreList scores={scores} areaColor={area.color} />
    </section>
  );
}

