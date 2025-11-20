import { type CSSProperties } from "react";
import { LifeArea } from "../../types";
import { cn, getContrastTextColor } from "../../lib/utils";

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
  const textColor = getContrastTextColor(area.color);

  return (
    <div
      className={cn(
        "post-it group rounded-lg transition-all",
        onClick && "cursor-pointer"
      )}
      style={
        {
          "--post-it-color": area.color,
          "--post-it-text": textColor,
        } as CSSProperties
      }
      onClick={onClick}
    >
      <div className="post-it__paper flex h-full flex-col p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{area.name}</h3>
            {area.description && (
              <p className="text-sm mb-2 opacity-90">{area.description}</p>
            )}
            {currentScore !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm opacity-80">Current Score:</span>
                <span className="text-lg font-bold">{currentScore}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

