import { ReactNode } from "react";
import { DndContext, closestCenter, type DndContextProps } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { ActionItem, LifeArea } from "../../types";

interface ActionItemsPanelProps {
  areas: LifeArea[];
  areaFilter?: number;
  onAreaFilterChange: (value: number | undefined) => void;
  actionItemsLoading: boolean;
  visibleItems: ActionItem[];
  canReorder: boolean;
  sensors: DndContextProps["sensors"];
  onDragStart: () => void;
  onDragEnd: (event: Parameters<NonNullable<DndContextProps["onDragEnd"]>>[0]) => void;
  onDragCancel: () => void;
  onCreateClick: () => void;
  renderCard: (item: ActionItem, draggable: boolean) => ReactNode;
}

export function ActionItemsPanel({
  areas,
  areaFilter,
  onAreaFilterChange,
  actionItemsLoading,
  visibleItems,
  canReorder,
  sensors,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onCreateClick,
  renderCard,
}: ActionItemsPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
        <div className="flex gap-2">
          <button
            onClick={onCreateClick}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            New Action
          </button>
          <select
            value={areaFilter ?? ""}
            onChange={(e) => onAreaFilterChange(e.target.value ? Number(e.target.value) : undefined)}
            className="custom-select px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
          >
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionItemsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <p>{areaFilter ? "No action items for this area" : "No action items found"}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mt-2">
          {areaFilter && (
            <p className="text-xs text-gray-500 mb-2">Reordering is available only when viewing all areas.</p>
          )}
          {canReorder ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
              <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-2 p-4">{visibleItems.map((item) => renderCard(item, true))}</div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-wrap gap-2 p-4">{visibleItems.map((item) => renderCard(item, false))}</div>
          )}
        </div>
      )}
    </div>
  );
}

