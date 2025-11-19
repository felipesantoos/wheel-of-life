import { useState, useMemo } from "react";
import { useLifeAreas } from "../lib/hooks";
import { useScores } from "../lib/hooks";
import { LifeArea } from "../types";
import { ArrowLeft, Calendar } from "lucide-react";
import { formatDateShort } from "../lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HistoryPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { areas } = useLifeAreas(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  // Get scores for selected area
  const { scores: areaScores } = useScores(selectedArea || undefined);

  // Get all scores for all areas (for comparison)
  const allScoresByArea = useMemo(() => {
    const result: Record<number, Array<{ date: string; score: number; timestamp: number }>> = {};
    areas.forEach((area) => {
      // This would need to be loaded, but for now we'll use a simplified approach
      result[area.id] = [];
    });
    return result;
  }, [areas]);

  const chartData = useMemo(() => {
    if (!selectedArea || areaScores.length === 0) return [];

    return [...areaScores]
      .reverse()
      .map((score) => ({
        date: formatDateShort(score.recorded_at),
        timestamp: score.recorded_at,
        score: score.value,
      }));
  }, [selectedArea, areaScores]);

  const selectedAreaData = areas.find((a) => a.id === selectedArea);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600 mt-1">
            View evolution of your life areas over time
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Area Selection */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select Area to View History
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedArea === area.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={
                  selectedArea === area.id
                    ? { borderColor: area.color }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <span className="font-semibold text-sm">{area.name}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Chart for Selected Area */}
        {selectedArea && selectedAreaData && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedAreaData.color }}
              />
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedAreaData.name} - Score Evolution
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
                      stroke={selectedAreaData.color}
                      strokeWidth={2}
                      dot={{ r: 4, fill: selectedAreaData.color }}
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

            {/* Score List */}
            {areaScores.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">All Scores</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {areaScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {formatDateShort(score.recorded_at)}
                      </span>
                      <span
                        className="font-semibold text-lg"
                        style={{ color: selectedAreaData.color }}
                      >
                        {score.value}/10
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {!selectedArea && (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Select an area above to view its score history
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

