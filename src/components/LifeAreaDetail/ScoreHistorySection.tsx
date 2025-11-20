import { LifeArea, Score } from "../../types";
import { formatDate } from "../../lib/utils";
import ScoreHistoryChart from "../ScoreHistoryChart";

interface ScoreHistorySectionProps {
  area: LifeArea;
  scores: Score[];
  onResetClick: () => void;
}

export default function ScoreHistorySection({
  area,
  scores,
  onResetClick,
}: ScoreHistorySectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Score History</h2>
        {scores.length > 0 && (
          <button
            onClick={onResetClick}
            className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset Score History
          </button>
        )}
      </div>
      <ScoreHistoryChart scores={scores} />
      {scores.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {scores.map((score) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="text-sm text-gray-700">
                {formatDate(score.recorded_at)}
              </span>
              <span className="font-semibold" style={{ color: area.color }}>
                {score.value}/10
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

