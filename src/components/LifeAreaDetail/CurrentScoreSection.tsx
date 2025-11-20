import { useState } from "react";
import { LifeArea, Score } from "../../types";
import { formatDate } from "../../lib/utils";
import ScoreForm from "../ScoreForm";
import { Plus } from "lucide-react";

interface CurrentScoreSectionProps {
  area: LifeArea;
  latestScore: Score | null | undefined;
  onCreateScore: (value: number) => Promise<void>;
}

export default function CurrentScoreSection({
  area,
  latestScore,
  onCreateScore,
}: CurrentScoreSectionProps) {
  const [showScoreForm, setShowScoreForm] = useState(false);

  const handleCreateScore = async (value: number) => {
    await onCreateScore(value);
    setShowScoreForm(false);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Current Score</h2>
        {!showScoreForm && (
          <button
            onClick={() => setShowScoreForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Score
          </button>
        )}
      </div>

      {showScoreForm ? (
        <div className="max-w-md">
          <ScoreForm
            onSubmit={handleCreateScore}
            currentScore={latestScore?.value}
          />
          <button
            onClick={() => setShowScoreForm(false)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          {latestScore ? (
            <div className="flex items-center gap-4">
              <div
                className="text-6xl font-bold"
                style={{ color: area.color }}
              >
                {latestScore.value}
              </div>
              <div>
                <p className="text-gray-600">out of 10</p>
                <p className="text-sm text-gray-500">
                  Recorded: {formatDate(latestScore.recorded_at)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No score recorded yet</p>
          )}
        </div>
      )}
    </section>
  );
}

