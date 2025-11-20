import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { LifeArea, Score } from "../../types";
import { formatDate } from "../../lib/utils";

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
  const [value, setValue] = useState<number>(latestScore?.value ?? 5);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (latestScore?.value !== undefined) {
      setValue(latestScore.value);
    }
  }, [latestScore?.value]);

  const handleValueChange = useCallback(async (newValue: number) => {
    if (newValue === value || isUpdating) return;
    
    setValue(newValue);
    setIsUpdating(true);
    try {
      await onCreateScore(newValue);
    } finally {
      setIsUpdating(false);
    }
  }, [value, isUpdating, onCreateScore]);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Current Score</h2>
      </div>

      <div className="flex-1 flex flex-col">
        {latestScore ? (
          <div className="text-center mb-6">
            <div
              className="text-6xl font-bold mb-2"
              style={{ color: area.color }}
            >
              {latestScore.value}
            </div>
            <p className="text-gray-600 mb-1">
              out of 10
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(latestScore.recorded_at)}
            </p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-gray-500">
              No score recorded yet
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Update Score
            </label>
            
            {/* Simple scale buttons */}
            <div className="flex items-center justify-center gap-0.5">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleValueChange(i)}
                  className={`
                    relative w-10 h-10 rounded-md transition-all duration-200
                    font-semibold text-xs flex items-center justify-center
                    overflow-hidden
                    ${i === value 
                      ? 'shadow-md' 
                      : 'hover:opacity-80'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{
                    backgroundColor: i <= value ? area.color : '#f3f4f6',
                    color: i <= value ? 'white' : '#6b7280',
                    opacity: i === value ? 1 : i < value ? 0.7 : 0.5,
                  } as CSSProperties}
                  disabled={isUpdating}
                >
                  {i <= value && (
                    <>
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
                          borderWidth: "0 0 20px 20px",
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
                    </>
                  )}
                  <span className="relative z-10">{i}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

