import { LifeArea } from "../../types";
import { cn } from "../../lib/utils";

interface LifeAreaCardProps {
  area: LifeArea;
  currentScore?: number;
  onClick?: () => void;
}

export default function LifeAreaCard({
  area,
  currentScore,
  onClick,
}: LifeAreaCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-4 border-2 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-opacity-50",
        !onClick && "border-transparent"
      )}
      style={{ borderColor: area.color }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            <h3 className="font-semibold text-gray-900">{area.name}</h3>
          </div>
          {area.description && (
            <p className="text-sm text-gray-600 mb-2">{area.description}</p>
          )}
          {currentScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current Score:</span>
              <span className="text-lg font-bold" style={{ color: area.color }}>
                {currentScore}/10
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

