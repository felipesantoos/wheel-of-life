import { LifeArea, Score } from "../../types";
import LifeAreaCard from "../LifeAreas/LifeAreaCard";
import { Edit2, Archive, RotateCcw } from "lucide-react";

interface LifeAreaCardWithActionsProps {
  area: LifeArea;
  currentScore?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
}

export default function LifeAreaCardWithActions({
  area,
  currentScore,
  onClick,
  onEdit,
  onArchive,
  onRestore,
  isArchived = false,
}: LifeAreaCardWithActionsProps) {
  return (
    <div className={`relative ${isArchived ? "opacity-60" : ""}`}>
      <LifeAreaCard
        area={area}
        currentScore={currentScore}
        onClick={onClick}
      />
      <div className="absolute top-2 right-2 flex gap-1">
        {!isArchived && (
          <>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
                className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </>
        )}
        {isArchived && onRestore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
            className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-green-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

