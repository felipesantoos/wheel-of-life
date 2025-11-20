import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface ScoreFormProps {
  onSubmit: (value: number) => Promise<void>;
  currentScore?: number;
}

export default function ScoreForm({ onSubmit, currentScore }: ScoreFormProps) {
  const [value, setValue] = useState<number>(currentScore ?? 5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentScore !== undefined) {
      setValue(currentScore);
    }
  }, [currentScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(value);
      setValue(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Score (0-10)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="10"
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-gray-900 w-12 text-center">
            {value}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>10</span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        disabled={isSubmitting}
      >
        <Check className="w-4 h-4" />
        {isSubmitting ? "Recording..." : "Record Score"}
      </button>
    </form>
  );
}

