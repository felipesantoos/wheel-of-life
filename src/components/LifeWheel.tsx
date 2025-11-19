import { useMemo, useState } from "react";
import { LifeArea, Score } from "../types";
import { cn, getContrastTextColor } from "../lib/utils";

interface LifeWheelProps {
  areas: LifeArea[];
  scores: Score[];
  onAreaClick?: (area: LifeArea) => void;
  onScoreClick?: (areaId: number, score: number) => void;
  size?: number;
}

export default function LifeWheel({
  areas,
  scores,
  onAreaClick,
  onScoreClick,
  size = 500,
}: LifeWheelProps) {
  const [hoveredCell, setHoveredCell] = useState<{ areaId: number; score: number } | null>(null);

  const scoreMap = useMemo(() => {
    const map = new Map<number, number>();
    scores.forEach((score) => {
      map.set(score.area_id, score.value);
    });
    return map;
  }, [scores]);

  const sortedAreas = useMemo(() => {
    return [...areas].sort((a, b) => a.order - b.order);
  }, [areas]);

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 40;
  const minRadius = 20;

  // Calculate angle for each area
  const anglePerArea = (2 * Math.PI) / sortedAreas.length;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate concentric circles (0-10)
  const circles = Array.from({ length: 11 }, (_, i) => i);

  // Calculate path for a slice from center to outer edge of selected cell
  const getSlicePath = (area: LifeArea, score: number) => {
    const index = sortedAreas.indexOf(area);
    const angle = startAngle + index * anglePerArea;
    const nextAngle = startAngle + (index + 1) * anglePerArea;

    // Calculate radius to outer edge of the selected cell
    // If score is 1, we want to color cells 0 and 1, so go to outer edge of cell 1
    // Outer edge of cell N is at (N+1)/10
    const scoreRadius = minRadius + ((score + 1) / 10) * (maxRadius - minRadius);

    // Outer arc (at outer edge of selected cell)
    const outerStartX = centerX + scoreRadius * Math.cos(angle);
    const outerStartY = centerY + scoreRadius * Math.sin(angle);
    const outerEndX = centerX + scoreRadius * Math.cos(nextAngle);
    const outerEndY = centerY + scoreRadius * Math.sin(nextAngle);

    const largeArc = anglePerArea > Math.PI ? 1 : 0;

    return `M ${centerX} ${centerY}
            L ${outerStartX} ${outerStartY}
            A ${scoreRadius} ${scoreRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}
            Z`;
  };

  // Calculate path for a specific cell (between two score levels)
  const getCellPath = (area: LifeArea, cellScore: number) => {
    const index = sortedAreas.indexOf(area);
    const angle = startAngle + index * anglePerArea;
    const nextAngle = startAngle + (index + 1) * anglePerArea;

    // Each cell represents a score value - ALL cells treated EXACTLY the same way
    // Cell 0: from minRadius to 1/10
    // Cell 1: from 1/10 to 2/10
    // ...
    // Cell 9: from 9/10 to 10/10
    // Cell 10: from 10/10 to 11/10 (calculated the same way as all others)
    const innerRadius = cellScore === 0
      ? minRadius
      : minRadius + (cellScore / 10) * (maxRadius - minRadius);
    
    const outerRadius = minRadius + ((cellScore + 1) / 10) * (maxRadius - minRadius);

    // Outer arc
    const outerStartX = centerX + outerRadius * Math.cos(angle);
    const outerStartY = centerY + outerRadius * Math.sin(angle);
    const outerEndX = centerX + outerRadius * Math.cos(nextAngle);
    const outerEndY = centerY + outerRadius * Math.sin(nextAngle);

    // Inner arc
    const innerStartX = centerX + innerRadius * Math.cos(nextAngle);
    const innerStartY = centerY + innerRadius * Math.sin(nextAngle);
    const innerEndX = centerX + innerRadius * Math.cos(angle);
    const innerEndY = centerY + innerRadius * Math.sin(angle);

    const largeArc = anglePerArea > Math.PI ? 1 : 0;

    return `M ${outerStartX} ${outerStartY}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}
            L ${innerStartX} ${innerStartY}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}
            Z`;
  };

  // Calculate path for the unselected part (from outer edge of selected cell to outer edge of cell 10)
  const getUnselectedPath = (area: LifeArea, score: number) => {
    const index = sortedAreas.indexOf(area);
    const angle = startAngle + index * anglePerArea;
    const nextAngle = startAngle + (index + 1) * anglePerArea;

    // Calculate radius to outer edge of selected cell (same as getSlicePath)
    const scoreRadius = minRadius + ((score + 1) / 10) * (maxRadius - minRadius);
    
    // Outer edge of cell 10 (11/10) - same calculation as circle 10
    const outerEdgeRadius = minRadius + ((10 + 1) / 10) * (maxRadius - minRadius);

    // Outer arc (at outer edge of cell 10)
    const outerStartX = centerX + outerEdgeRadius * Math.cos(angle);
    const outerStartY = centerY + outerEdgeRadius * Math.sin(angle);
    const outerEndX = centerX + outerEdgeRadius * Math.cos(nextAngle);
    const outerEndY = centerY + outerEdgeRadius * Math.sin(nextAngle);

    // Inner arc (at score radius)
    const innerStartX = centerX + scoreRadius * Math.cos(nextAngle);
    const innerStartY = centerY + scoreRadius * Math.sin(nextAngle);
    const innerEndX = centerX + scoreRadius * Math.cos(angle);
    const innerEndY = centerY + scoreRadius * Math.sin(angle);

    const largeArc = anglePerArea > Math.PI ? 1 : 0;

    return `M ${innerStartX} ${innerStartY}
            L ${outerStartX} ${outerStartY}
            A ${outerEdgeRadius} ${outerEdgeRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}
            L ${innerEndX} ${innerEndY}
            A ${scoreRadius} ${scoreRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}
            Z`;
  };

  // Get label position for area
  const getLabelPosition = (area: LifeArea) => {
    const index = sortedAreas.indexOf(area);
    const angle = startAngle + index * anglePerArea + anglePerArea / 2;
    // Calculate the outer edge of cell 10 (11/10) - same as circle 10
    const outerEdgeRadius = minRadius + ((10 + 1) / 10) * (maxRadius - minRadius);
    // Place labels further outside the wheel
    const labelRadius = outerEdgeRadius + 50;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { x, y, angle };
  };


  if (sortedAreas.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-center px-8">
          No life areas yet. Create your first area to see the wheel!
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        className="overflow-visible"
        style={{ cursor: onScoreClick ? "pointer" : "default" }}
      >
        {/* Draw area slices first (background layer) */}
        {sortedAreas.map((area) => {
          const score = scoreMap.get(area.id) ?? 0;
          const path = getSlicePath(area, score);
          const labelPos = getLabelPosition(area);
          const index = sortedAreas.indexOf(area);
          const angle = startAngle + index * anglePerArea + anglePerArea / 2;

          return (
            <g key={area.id}>
              {/* Unselected part (from score to max) - grey background */}
              {score < 10 && (
                <path
                  d={getUnselectedPath(area, score)}
                  fill="#f9fafb"
                  stroke="none"
                  className="pointer-events-none"
                />
              )}
              {/* Selected part (from center to score) - area color */}
              <path
                d={path}
                fill={area.color}
                stroke="none"
                className={cn(
                  "transition-opacity hover:opacity-80",
                  onAreaClick && !onScoreClick && "cursor-pointer hover:opacity-70"
                )}
                onClick={(e) => {
                  if (onAreaClick && !onScoreClick) {
                    e.stopPropagation();
                    onAreaClick(area);
                  }
                }}
              />
              
              {/* Numbers 0-10 in each slice, positioned in the middle of each cell */}
              {circles.map((circle) => {
                // Each cell represents a score value - ALL cells treated EXACTLY the same way
                const radius = circle === 0
                  ? minRadius
                  : minRadius + (circle / 10) * (maxRadius - minRadius);
                
                const nextRadius = minRadius + ((circle + 1) / 10) * (maxRadius - minRadius);
                
                // Position in the center of the cell (50% between inner and outer radius)
                const labelRadius = radius + (nextRadius - radius) * 0.5;
                const labelX = centerX + labelRadius * Math.cos(angle);
                const labelY = centerY + labelRadius * Math.sin(angle);
                
                // Determine text color based on whether this cell is in selected (colored) or unselected (grey) area
                // A cell is selected if the score is greater than or equal to the cell number
                // ALL cells (0-10) treated the same way
                const isInSelectedArea = circle <= score;
                const backgroundColor = isInSelectedArea ? area.color : "#f9fafb";
                const textColor = getContrastTextColor(backgroundColor);
                
                return (
                  <text
                    key={circle}
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-semibold pointer-events-none select-none"
                    style={{ 
                      fontSize: '9px',
                      fill: textColor
                    }}
                  >
                    {circle}
                  </text>
                );
              })}
              
              {/* Label - clickable to view area details */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  "text-xs font-medium select-none",
                  onAreaClick && "cursor-pointer"
                )}
                style={{
                  fill: "black",
                  opacity: onAreaClick ? 1 : 0.9
                }}
                onClick={(e) => {
                  if (onAreaClick) {
                    e.stopPropagation();
                    onAreaClick(area);
                  }
                }}
                onMouseEnter={(e) => {
                  if (onAreaClick) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (onAreaClick) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
              >
                {area.name}
              </text>
            </g>
          );
        })}

        {/* Draw concentric circles on top (so they appear above the grey background) */}
        {/* ALL circles calculated the EXACT same way - NO special cases at all */}
        {circles.map((circle) => {
          // Each circle is at the outer edge of its corresponding cell
          // Circle 0 = outer edge of cell 0 = 1/10
          // Circle 1 = outer edge of cell 1 = 2/10
          // ...
          // Circle 10 = outer edge of cell 10 = 11/10
          const radius = minRadius + ((circle + 1) / 10) * (maxRadius - minRadius);
          
          return (
            <circle
              key={circle}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={circle === 0 ? 2 : 1}
              className="pointer-events-none"
            />
          );
        })}

        {/* Draw radial borders (side borders between slices) on top */}
        {/* Borders go to the outer edge of cell 10 (11/10) - same calculation as all circles */}
        {sortedAreas.map((area, index) => {
          const angle = startAngle + index * anglePerArea;
          // Calculate the outer edge of cell 10 (11/10) - same formula as circle 10
          const outerEdgeRadius = minRadius + ((10 + 1) / 10) * (maxRadius - minRadius);
          return (
            <line
              key={`border-${area.id}`}
              x1={centerX}
              y1={centerY}
              x2={centerX + outerEdgeRadius * Math.cos(angle)}
              y2={centerY + outerEdgeRadius * Math.sin(angle)}
              stroke={area.color}
              strokeWidth={2}
              className="pointer-events-none"
            />
          );
        })}

        {/* Draw hover overlays on top of everything for better clickability */}
        {/* Render ALL cells in order - no special treatment for cell 10 */}
        {onScoreClick && sortedAreas.map((area) => {
          return (
            <g key={`hover-overlay-${area.id}`}>
              {circles.map((circle) => {
                const isHovered = hoveredCell?.areaId === area.id && hoveredCell?.score === circle;
                return (
                  <path
                    key={`hover-top-${area.id}-${circle}`}
                    d={getCellPath(area, circle)}
                    fill={isHovered ? "rgba(0, 0, 0, 0.1)" : "transparent"}
                    stroke="none"
                    className="pointer-events-auto cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredCell({ areaId: area.id, score: circle })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScoreClick(area.id, circle);
                    }}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={minRadius}
          fill="white"
          stroke="#d1d5db"
          strokeWidth={2}
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
}

