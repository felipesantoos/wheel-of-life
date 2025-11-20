import { LifeArea, Score } from "../../types";
import LifeAreaCard from "../LifeAreas/LifeAreaCard";
import { Edit2, Archive, RotateCcw } from "lucide-react";
import { getContrastTextColor } from "../../lib/utils";

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
  const textColor = getContrastTextColor(area.color);

  return (
    <div className={`relative group ${isArchived ? "opacity-60" : ""}`}>
      <LifeAreaCard
        area={area}
        currentScore={currentScore}
        onClick={onClick}
      />
      <div className="absolute top-2 right-2 flex gap-1 transition-transform duration-300 ease-in-out group-hover:-translate-y-0.5">
        {!isArchived && (
          <>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded transition-colors opacity-70 hover:opacity-100"
                style={{ color: textColor }}
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
                className="p-1.5 rounded transition-colors opacity-70 hover:opacity-100"
                style={{ color: textColor }}
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
            className="p-1.5 rounded transition-colors opacity-70 hover:opacity-100"
            style={{ color: textColor }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

