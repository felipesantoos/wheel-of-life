import { ReactNode, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ActionItem, LifeArea } from "../../types";
import { getContrastTextColor } from "../../lib/utils";

interface PostItCardProps {
  item: ActionItem;
  area?: LifeArea;
  onPointerDown: (itemId: number, event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (item: ActionItem, event: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick?: (item: ActionItem) => void;
}

export function PostItCard({ item, area, onPointerDown, onPointerUp, onDoubleClick }: PostItCardProps) {
  const areaColor = area?.color || "#e5e7eb";
  const textColor = getContrastTextColor(areaColor);

  const titleLength = item.title.length;
  const computedFontSize = Math.max(9, 12 - Math.floor(titleLength / 15));
  const maxLines = titleLength > 60 ? 5 : titleLength > 40 ? 4 : 3;

  return (
    <div
      className="w-[95px] h-[95px] post-it-wrapper select-none cursor-pointer"
      onPointerDown={(event) => onPointerDown(item.id, event)}
      onPointerUp={(event) => onPointerUp(item, event)}
      onDoubleClick={() => onDoubleClick?.(item)}
    >
      <div
        className="post-it post-it--small group"
        style={{ "--post-it-color": areaColor, "--post-it-text": textColor } as CSSProperties}
      >
        <div className="post-it__paper flex h-full flex-col gap-1 p-2 pb-3">
          <div
            className="mt-0.5 font-medium pr-1 overflow-hidden break-words"
            style={{
              fontSize: `${computedFontSize}px`,
              lineHeight: 1.1,
              display: "block",
              maxHeight: `${maxLines * 1.2}em`,
              wordBreak: "break-word",
              hyphens: "auto",
            }}
          >
            {item.title}
          </div>
          <div className="mt-auto text-right text-[9px] font-semibold uppercase tracking-wide opacity-80 mr-2 overflow-hidden">
            <span className="block truncate w-full" title={area?.name || "Unknown Area"}>
              {area?.name || "Unknown Area"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SortablePostItCardProps extends PostItCardProps {
  itemId: number;
  children?: ReactNode;
}

export function SortablePostItCard({ itemId, item, area, onPointerDown, onPointerUp, onDoubleClick }: SortablePostItCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PostItCard
        item={item}
        area={area}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}

