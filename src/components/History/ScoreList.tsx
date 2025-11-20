import { Score } from "../../types";
import { formatDateShort } from "../../lib/utils";

interface ScoreListProps {
  scores: Score[];
  areaColor: string;
}

export default function ScoreList({ scores, areaColor }: ScoreListProps) {
  if (scores.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="font-medium text-gray-900 mb-3">All Scores</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {scores.map((score) => (
          <div
            key={score.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm text-gray-700">
              {formatDateShort(score.recorded_at)}
            </span>
            <span
              className="font-semibold text-lg"
              style={{ color: areaColor }}
            >
              {score.value}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

