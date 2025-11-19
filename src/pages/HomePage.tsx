import { useState, useEffect, useMemo, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLifeAreas, useAllLatestScores, useAllActionItems } from "../lib/hooks";
import LifeWheel from "../components/LifeWheel";
import ActionItemForm from "../components/ActionItemForm";
import { LifeArea, ActionItem, Page } from "../types";
import { Settings, History, Plus, Edit2, Archive } from "lucide-react";
import { toast } from "sonner";
import { getContrastTextColor } from "../lib/utils";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HomePageProps {
  onNavigate: (page: Page, data?: any) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { areas, loading } = useLifeAreas(false);
  const { scores, refresh: refreshScores } = useAllLatestScores();
  const [areaFilter, setAreaFilter] = useState<number | undefined>(undefined);
  const { items: actionItems, loading: actionItemsLoading, refresh: refreshActionItems, reorder: reorderActionItems } =
    useAllActionItems();
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [orderedItems, setOrderedItems] = useState<ActionItem[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  // Block background scroll when modal is open
  useEffect(() => {
    if (showActionItemModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showActionItemModal]);

  // Reset editing item when modal closes
  useEffect(() => {
    if (!showActionItemModal) {
      setEditingItem(null);
    }
  }, [showActionItemModal]);

  useEffect(() => {
    const sorted = [...actionItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    setOrderedItems(sorted);
  }, [actionItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const visibleItems = useMemo(() => {
    if (!areaFilter) {
      return orderedItems;
    }
    return orderedItems.filter((item) => item.area_id === areaFilter);
  }, [orderedItems, areaFilter]);

  const canReorder = !areaFilter && !actionItemsLoading && visibleItems.length > 1 && !isReordering;

  const handleAreaClick = (area: LifeArea) => {
    onNavigate("detail", { areaId: area.id });
  };

  const handleScoreClick = async (areaId: number, score: number) => {
    try {
      await invoke("create_score", { areaId, value: score });
      await refreshScores();
      toast.success(`Score updated to ${score}/10`, {
        id: `score-update-${areaId}-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update score";
      toast.error(message, {
        id: `score-error-${areaId}-${Date.now()}`,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);
    const oldIndex = orderedItems.findIndex((item) => item.id === activeId);
    const newIndex = orderedItems.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const previousItems = orderedItems;
    const newOrder = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(newOrder);
    setIsReordering(true);

    const payload = newOrder.map((item, index) => ({
      id: item.id,
      position: index,
    }));

    try {
      await reorderActionItems(payload);
      await refreshActionItems();
    } catch (err) {
      setOrderedItems(previousItems);
      const message = err instanceof Error ? err.message : "Failed to reorder action items";
      toast.error(message, {
        id: `reorder-error-${Date.now()}`,
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleCreateActionItem = async (areaId: number, title: string) => {
    try {
      await invoke("create_action_item", {
        areaId,
        title,
      });
      await refreshActionItems();
      setShowActionItemModal(false);
      toast.success("Action item created successfully", {
        id: `create-item-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create action item";
      toast.error(message, {
        id: `create-item-error-${Date.now()}`,
      });
    }
  };

  const handleUpdateActionItem = async (_areaId: number, title: string) => {
    if (!editingItem) return;
    
    try {
      await invoke("update_action_item", {
        id: editingItem.id,
        title,
      });
      await refreshActionItems();
      setShowActionItemModal(false);
      setEditingItem(null);
      toast.success("Action item updated successfully", {
        id: `update-item-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update action item";
      toast.error(message, {
        id: `update-item-error-${Date.now()}`,
      });
    }
  };

  const handleArchiveActionItem = async (itemId: number) => {
    try {
      await invoke("archive_action_item", { id: itemId });
      await refreshActionItems();
      toast.success("Action item archived", {
        id: `archive-item-${itemId}-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to archive action item";
      toast.error(message, {
        id: `archive-item-error-${itemId}-${Date.now()}`,
      });
    }
  };

  const renderPostIt = (item: ActionItem, draggable: boolean) => {
    const area = areas.find((a) => a.id === item.area_id);
    const areaColor = area?.color || "#e5e7eb";
    const textColor = getContrastTextColor(areaColor);

    const card = (
      <div className="w-[90px] h-[90px]">
        <div
          className="group relative flex h-full flex-col gap-1 p-1 border border-black/10 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          style={{
            backgroundColor: areaColor,
            color: textColor,
            boxShadow: "3px 4px 8px rgba(15,23,42,0.15)",
            borderRadius: 0,
          }}
        >
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={() => handleEditClick(item)}
              className="p-1 rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
              title="Edit action item"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleArchiveActionItem(item.id)}
              className="p-1 rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
              title="Archive action item"
            >
              <Archive className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-0.5 text-xs font-medium leading-snug break-words pr-1">
            {item.title}
          </div>
          <div className="mt-auto text-right text-[9px] font-semibold uppercase tracking-wide opacity-80">
            <span>{area?.name || "Unknown Area"}</span>
          </div>
        </div>
      </div>
    );

    if (draggable) {
      return (
        <SortablePostIt key={item.id} itemId={item.id}>
          {card}
        </SortablePostIt>
      );
    }

    return (
      <div key={item.id}>
        {card}
      </div>
    );
  };

  const handleEditClick = (item: ActionItem) => {
    setEditingItem(item);
    setShowActionItemModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Wheel of Life!
          </h2>
          <p className="text-gray-600 mb-6">
            Get started by creating your first life area. This will help you track
            different aspects of your life and visualize your progress.
          </p>
          <button
            onClick={() => onNavigate("manage")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Your First Area
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Life Wheel</h1>
          <p className="text-gray-600 mt-1">
            Click on any cell in the wheel to update scores, or click an area name to view details
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("history")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => onNavigate("manage")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Areas
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Left Column: Life Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
          <LifeWheel
            areas={areas}
            scores={scores}
            onAreaClick={handleAreaClick}
            onScoreClick={handleScoreClick}
            size={500}
          />
          <p className="text-sm text-gray-600 mt-10 text-center">
            Click anywhere on the wheel to update scores. Click area names to view details.
          </p>
        </div>

        {/* Right Column: Action Items */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowActionItemModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                New Action
              </button>
              <select
                value={areaFilter || ""}
                onChange={(e) => setAreaFilter(e.target.value ? Number(e.target.value) : undefined)}
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
            <div className="flex-1 overflow-y-auto pr-1 mt-2">
              {areaFilter && (
                <p className="text-xs text-gray-500 mb-2">
                  Reordering is available only when viewing all areas.
                </p>
              )}
              {isReordering && (
                <p className="text-xs text-blue-600 mb-2">Saving order...</p>
              )}
              {canReorder ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                    <div className="flex flex-wrap gap-1">
                      {visibleItems.map((item) => renderPostIt(item, true))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {visibleItems.map((item) => renderPostIt(item, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Item Modal */}
      {showActionItemModal && (
        <div 
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowActionItemModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <ActionItemForm
                item={editingItem || undefined}
                areaId={editingItem?.area_id}
                areas={areas}
                showAreaSelector={!editingItem}
                showHeader={true}
                showCardWrapper={false}
                onSubmit={editingItem ? handleUpdateActionItem : handleCreateActionItem}
                onCancel={() => {
                  setShowActionItemModal(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortablePostIt({ itemId, children }: { itemId: number; children: ReactNode }) {
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
      {children}
    </div>
  );
}

