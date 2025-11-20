import { LifeArea, Score } from "../../types";
import ScoreHistoryChart from "../Scores/ScoreHistoryChart";
import { RotateCw } from "lucide-react";
import { type CSSProperties } from "react";

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
    <section className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Score History</h2>
        {scores.length > 0 && (
          <button
            onClick={onResetClick}
            className="relative px-3 py-1.5 text-sm text-white rounded-lg transition-colors flex items-center gap-2 shadow-md overflow-hidden hover:opacity-90"
            style={{
              backgroundColor: "#dc2626",
            } as CSSProperties}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.2), transparent 65%), linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent 40%)",
                opacity: 0.65,
                mixBlendMode: "screen",
              } as CSSProperties}
            />
            <div
              className="absolute bottom-0 right-0 pointer-events-none"
              style={{
                borderStyle: "solid",
                borderWidth: "0 0 28px 28px",
                borderColor: "transparent transparent rgba(15, 23, 42, 0.18) transparent",
                opacity: 0.35,
              } as CSSProperties}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
              } as CSSProperties}
            />
            <RotateCw className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Reset</span>
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <ScoreHistoryChart scores={scores} areaColor={area.color} />
      </div>
    </section>
  );
}

