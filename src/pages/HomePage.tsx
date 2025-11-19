import { useState, useEffect, useMemo, ReactNode, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { useLifeAreas, useAllLatestScores, useAllActionItems } from "../lib/hooks";
import LifeWheel from "../components/LifeWheel";
import { LifeArea, ActionItem, Page } from "../types";
import { Settings, History, Plus, Edit2, Archive, X, Save } from "lucide-react";
import { toast } from "sonner";
import { getContrastTextColor } from "../lib/utils";
import ConfirmDialog from "../components/ConfirmDialog";
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

type CSSVars = CSSProperties & Record<`--${string}`, string>;

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
  const [isDraggingPostIt, setIsDraggingPostIt] = useState(false);
  const clickInfoRef = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
  const [expandedItem, setExpandedItem] = useState<ActionItem | null>(null);
  const [isExpandedEditing, setIsExpandedEditing] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const areaButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [itemToArchive, setItemToArchive] = useState<number | null>(null);

  // Block background scroll when modal is open
  useEffect(() => {
    if (showActionItemModal || expandedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showActionItemModal, expandedItem]);

  // Reset editing item when modal closes
  useEffect(() => {
    if (!showActionItemModal) {
      setEditingItem(null);
      setEditDraft("");
      setSelectedAreaId(null);
      setShowAreaDropdown(false);
      setDropdownPosition(null);
    } else if (!editingItem && areas.length > 0) {
      // Initialize with first area when creating new item
      setSelectedAreaId(areas[0].id);
      setShowAreaDropdown(false);
      setDropdownPosition(null);
    }
  }, [showActionItemModal, editingItem, areas]);

  // Initialize edit draft when editing item changes
  useEffect(() => {
    if (editingItem) {
      setEditDraft(editingItem.title);
      setSelectedAreaId(editingItem.area_id);
      setShowAreaDropdown(false);
      setDropdownPosition(null);
    }
  }, [editingItem]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (showAreaDropdown) {
      // Use a small timeout to ensure the DOM is ready and button is rendered
      const timer = setTimeout(() => {
        if (areaButtonRef.current) {
          const rect = areaButtonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setDropdownPosition(null);
    }
  }, [showAreaDropdown]);

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

  const canReorder =
    !areaFilter && !actionItemsLoading && visibleItems.length > 1 && !isReordering && !expandedItem;
  const expandedArea = expandedItem ? areas.find((a) => a.id === expandedItem.area_id) : null;
  const expandedPaperColor = expandedArea?.color || "#fef9c3";
  const expandedPostItTheme: CSSVars = {
    "--post-it-color": expandedPaperColor,
    "--post-it-text": getContrastTextColor(expandedPaperColor),
  };

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
    setIsDraggingPostIt(false);
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

  const updateActionItemTitle = async (itemId: number, title: string) => {
    try {
      await invoke("update_action_item", {
        id: itemId,
        title,
      });
      await refreshActionItems();
      toast.success("Action item updated successfully", {
        id: `update-item-${itemId}-${Date.now()}`,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update action item";
      toast.error(message, {
        id: `update-item-error-${itemId}-${Date.now()}`,
      });
      return false;
    }
  };

  const handleUpdateActionItem = async (_areaId: number, title: string) => {
    if (!editingItem) return;
    const trimmed = title.trim();
    if (!trimmed) return;

    const success = await updateActionItemTitle(editingItem.id, trimmed);
    if (success) {
      setShowActionItemModal(false);
      setEditingItem(null);
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

  const requestArchiveActionItem = (itemId: number) => {
    setItemToArchive(itemId);
    setShowArchiveDialog(true);
  };

  const confirmArchiveActionItem = async () => {
    if (itemToArchive === null) return;
    const itemId = itemToArchive;
    setShowArchiveDialog(false);
    setItemToArchive(null);
    
    // Close modals if open
    if (editingItem?.id === itemId) {
      setShowActionItemModal(false);
      setEditingItem(null);
      setEditDraft("");
      setShowAreaDropdown(false);
    }
    if (expandedItem?.id === itemId) {
      closeExpandedModal();
    }
    
    await handleArchiveActionItem(itemId);
  };

  const openExpandedModal = (item: ActionItem) => {
    setExpandedItem(item);
    setExpandedDraft(item.title);
    setIsExpandedEditing(false);
  };

  const closeExpandedModal = () => {
    setExpandedItem(null);
    setIsExpandedEditing(false);
    setExpandedDraft("");
  };

  const handleExpandedSave = async () => {
    if (!expandedItem) return;
    const trimmed = expandedDraft.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty");
      return;
    }

    const success = await updateActionItemTitle(expandedItem.id, trimmed);
    if (success) {
      setExpandedItem({ ...expandedItem, title: trimmed });
      setExpandedDraft(trimmed);
      setIsExpandedEditing(false);
    }
  };

  const handleExpandedCancelEditing = () => {
    if (expandedItem) {
      setExpandedDraft(expandedItem.title);
    }
    setIsExpandedEditing(false);
  };

  const handleEditSave = async () => {
    const trimmed = editDraft.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty");
      return;
    }

    if (editingItem) {
      // Update existing item
      const titleChanged = trimmed !== editingItem.title.trim();
      const areaChanged = selectedAreaId !== null && selectedAreaId !== editingItem.area_id;
      
      let titleSuccess = true;
      if (titleChanged) {
        titleSuccess = await updateActionItemTitle(editingItem.id, trimmed);
      }
      
      if (titleSuccess && areaChanged) {
        // Update area
        try {
          await invoke("update_action_item_area", {
            id: editingItem.id,
            areaId: selectedAreaId,
          });
          await refreshActionItems();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to update area";
          toast.error(message);
          return;
        }
      }
      
      if (titleSuccess) {
        setShowActionItemModal(false);
        setEditingItem(null);
        setEditDraft("");
        setShowAreaDropdown(false);
      }
    } else {
      // Create new item
      if (!selectedAreaId) {
        toast.error("Please select an area");
        return;
      }
      await handleCreateActionItem(selectedAreaId, trimmed);
      setEditDraft("");
      setSelectedAreaId(null);
      setShowAreaDropdown(false);
    }
  };

  const handlePostItPointerDown = (itemId: number, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    clickInfoRef.current = {
      id: itemId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  };

  const handlePostItPointerUp = (item: ActionItem, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const info = clickInfoRef.current;
    clickInfoRef.current = null;
    if (!info || info.id !== item.id) return;
    if (isDraggingPostIt) return;
    const distance = Math.hypot(event.clientX - info.x, event.clientY - info.y);
    const duration = performance.now() - info.time;
    if (distance <= 5 && duration <= 300) {
      setEditingItem(item);
      setShowActionItemModal(true);
    }
  };

  const handleActionButtonPointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleActionButtonPointerUp = (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleDragStart = () => {
    setIsDraggingPostIt(true);
  };

  const handleDragCancel = () => {
    setIsDraggingPostIt(false);
  };

  const renderPostIt = (item: ActionItem, draggable: boolean) => {
    const area = areas.find((a) => a.id === item.area_id);
    const areaColor = area?.color || "#e5e7eb";
    const textColor = getContrastTextColor(areaColor);
    const postItTheme: CSSVars = {
      "--post-it-color": areaColor,
      "--post-it-text": textColor,
    };

    const titleLength = item.title.length;
    const computedFontSize = Math.max(9, 12 - Math.floor(titleLength / 15));
    const maxLines = titleLength > 60 ? 5 : titleLength > 40 ? 4 : 3;

    const card = (
      <div 
        className="w-[95px] h-[95px] post-it-wrapper select-none cursor-pointer"
        onPointerDown={(e) => handlePostItPointerDown(item.id, e)}
        onPointerUp={(e) => handlePostItPointerUp(item, e)}
      >
        <div className="post-it post-it--small group" style={postItTheme}>
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
            <div className="mt-auto text-right text-[9px] font-semibold uppercase tracking-wide opacity-80 mr-2">
              <span>{area?.name || "Unknown Area"}</span>
            </div>
          </div>
        </div>
      </div>
    );

    if (draggable) {
      return (
        <SortablePostIt
          key={item.id}
          itemId={item.id}
        >
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
            <div className="flex-1 overflow-y-auto mt-2">
              {areaFilter && (
                <p className="text-xs text-gray-500 mb-2">
                  Reordering is available only when viewing all areas.
                </p>
              )}
              {canReorder ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                    <div className="flex flex-wrap gap-2 p-4">
                      {visibleItems.map((item) => renderPostIt(item, true))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex flex-wrap gap-2 p-4">
                  {visibleItems.map((item) => renderPostIt(item, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Item Modal */}
      {showActionItemModal && (() => {
        const editArea = selectedAreaId 
          ? areas.find((a) => a.id === selectedAreaId)
          : editingItem 
            ? areas.find((a) => a.id === editingItem.area_id)
            : null;
        const editPaperColor = editArea?.color || "#fef9c3";
        const editPostItTheme: CSSVars = {
          "--post-it-color": editPaperColor,
          "--post-it-text": getContrastTextColor(editPaperColor),
        };
        const hasChanges = editingItem 
          ? editDraft.trim() !== editingItem.title.trim() || (selectedAreaId !== null && selectedAreaId !== editingItem.area_id)
          : editDraft.trim().length > 0 && selectedAreaId !== null;
        return (
          <div 
            className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[100] px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowActionItemModal(false);
                setEditingItem(null);
                setEditDraft("");
                setSelectedAreaId(null);
                setShowAreaDropdown(false);
              }
            }}
          >
            <div 
              className="flex items-center justify-center w-full max-w-3xl"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowActionItemModal(false);
                  setEditingItem(null);
                  setEditDraft("");
                  setSelectedAreaId(null);
                  setShowAreaDropdown(false);
                }
              }}
            >
              <div
                className="relative origin-center"
                onClick={(e) => {
                  e.stopPropagation();
                  // Close dropdown if clicking outside of it
                  if (showAreaDropdown && !(e.target as HTMLElement).closest('.area-dropdown')) {
                    setShowAreaDropdown(false);
                  }
                }}
                style={{
                  transform: "rotate(-2deg)",
                  transformOrigin: "center",
                  zIndex: 101,
                }}
              >
                <button
                  onClick={() => {
                    setShowActionItemModal(false);
                    setEditingItem(null);
                    setEditDraft("");
                    setSelectedAreaId(null);
                    setShowAreaDropdown(false);
                  }}
                  className="absolute top-2 right-2 text-white/40 hover:text-white/70 transition-colors z-10 p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                <div
                  className="post-it post-it--large w-[360px] aspect-square sm:w-[420px]"
                  style={editPostItTheme}
                >
                  <div className="post-it__paper flex h-full flex-col gap-4 p-5 sm:p-6">
                    <div className="flex-1 overflow-y-auto pr-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full h-full bg-transparent border-0 rounded-sm p-3 text-xl font-semibold leading-snug resize-none focus:outline-none focus:ring-0 placeholder-white/60"
                        maxLength={80}
                        autoFocus
                        placeholder={editingItem ? "" : "Enter action item title..."}
                      />
                    </div>
                    <div className="mt-auto flex items-center justify-between text-[11px] uppercase tracking-wide opacity-80 mb-2 px-3" style={{ overflow: 'visible' }}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditSave();
                          }}
                          onPointerDown={handleActionButtonPointerDown}
                          onPointerUp={handleActionButtonPointerUp}
                          disabled={!hasChanges}
                          className="inline-flex items-center justify-center text-white/60 hover:text-white/90 transition-colors disabled:opacity-30 p-1"
                          title="Save"
                        >
                          <Save className="w-6 h-6" />
                        </button>
                        {editingItem && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              requestArchiveActionItem(editingItem.id);
                            }}
                            onPointerDown={handleActionButtonPointerDown}
                            onPointerUp={handleActionButtonPointerUp}
                            className="inline-flex items-center justify-center text-white/60 hover:text-white/90 transition-colors p-1"
                            title="Archive"
                          >
                            <Archive className="w-6 h-6" />
                          </button>
                        )}
                        <span className="text-[10px] text-white/50">
                          {editDraft.length}/80
                        </span>
                      </div>
                      {!editingItem ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedAreaId || ""}
                            onChange={(e) => {
                              setSelectedAreaId(Number(e.target.value));
                            }}
                            className="bg-transparent border-0 text-[11px] uppercase tracking-wide opacity-80 focus:outline-none cursor-pointer appearance-none pr-4 hover:opacity-100 transition-opacity"
                            style={{ 
                              color: editPostItTheme["--post-it-text"],
                              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4' opacity='0.5'/%3E%3C/svg%3E\")",
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right center',
                              backgroundSize: '0.7em 0.7em'
                            }}
                          >
                            {areas.map((area) => (
                              <option key={area.id} value={area.id} style={{ color: "#1f2937" }}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                          <Edit2 className="w-3 h-3 opacity-60" style={{ color: editPostItTheme["--post-it-text"] }} />
                        </div>
                      ) : (
                        <div className="relative" style={{ zIndex: 1000, overflow: 'visible' }}>
                          <button
                            ref={areaButtonRef}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAreaDropdown(!showAreaDropdown);
                            }}
                            className="text-[11px] uppercase tracking-wide opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                            style={{ color: editPostItTheme["--post-it-text"] }}
                          >
                            {editArea?.name || "Unknown Area"}
                            <svg 
                              className="w-3 h-3 transition-transform" 
                              style={{ 
                                transform: showAreaDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                opacity: 0.6
                              }}
                              fill="none" 
                              viewBox="0 0 20 20"
                            >
                              <path 
                                stroke="currentColor" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="1.5" 
                                d="M6 8l4 4 4-4"
                              />
                            </svg>
                          </button>
                          {showAreaDropdown && dropdownPosition && createPortal(
                            <div 
                              className="area-dropdown fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                zIndex: 99999,
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                width: 'auto',
                                minWidth: '120px',
                                maxWidth: '200px',
                              }}
                            >
                              {areas.map((area) => (
                                <button
                                  key={area.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAreaId(area.id);
                                    setShowAreaDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                    selectedAreaId === area.id ? 'bg-gray-100 font-medium' : ''
                                  }`}
                                  style={{ 
                                    color: selectedAreaId === area.id ? area.color : '#1f2937'
                                  }}
                                >
                                  {area.name}
                                </button>
                              ))}
                            </div>,
                            document.body
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Expanded Action Item Modal */}
      {expandedItem && (
        <div
          className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeExpandedModal();
            }
          }}
        >
          <div className="flex items-center justify-center w-full max-w-3xl">
            <div
              className="relative origin-center animate-[pop_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: "rotate(-2deg)",
                transformOrigin: "center",
              }}
            >
              <button
                onClick={closeExpandedModal}
                className="absolute -top-5 -right-5 bg-black/70 text-white rounded-full p-2 hover:bg-black transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div
                className="post-it post-it--large group w-[360px] h-[360px] sm:w-[420px] sm:h-[420px]"
                style={expandedPostItTheme}
              >
                <div className="post-it__paper flex h-full flex-col gap-4 p-5 sm:p-6">
                  <div className="flex-1 overflow-y-auto pr-2">
                    {isExpandedEditing ? (
                      <textarea
                        value={expandedDraft}
                        onChange={(e) => setExpandedDraft(e.target.value)}
                        className="w-full h-full bg-transparent border border-white/40 rounded-sm p-3 text-xl font-semibold leading-snug resize-none focus:outline-none focus:ring-2 focus:ring-white/70 placeholder-white/60"
                        maxLength={80}
                        autoFocus
                      />
                    ) : (
                      <p className="text-xl font-semibold whitespace-pre-wrap break-words leading-snug">
                        {expandedItem.title}
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-end text-[11px] uppercase tracking-wide opacity-80 mb-2 mr-3">
                    <span>{expandedArea?.name || "Unknown Area"}</span>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start gap-2 px-5 py-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-95 group-hover:pointer-events-auto" style={{ backgroundColor: 'transparent' }}>
                    {isExpandedEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleExpandedSave();
                          }}
                          onPointerDown={handleActionButtonPointerDown}
                          onPointerUp={handleActionButtonPointerUp}
                          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleExpandedCancelEditing();
                          }}
                          onPointerDown={handleActionButtonPointerDown}
                          onPointerUp={handleActionButtonPointerUp}
                          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/25 px-4 py-1.5 text-xs text-white transition-colors hover:bg-white/45"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label="Editar ação"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingItem(expandedItem);
                            setShowActionItemModal(true);
                            closeExpandedModal();
                          }}
                          onPointerDown={handleActionButtonPointerDown}
                          onPointerUp={handleActionButtonPointerUp}
                          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          title="Edit action item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Arquivar ação"
                          onClick={(event) => {
                            event.stopPropagation();
                            requestArchiveActionItem(expandedItem.id);
                          }}
                          onPointerDown={handleActionButtonPointerDown}
                          onPointerUp={handleActionButtonPointerUp}
                          className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          title="Archive action item"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Archive Post-it"
        message="Are you sure you want to archive this post-it? It will be hidden from the main list."
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={confirmArchiveActionItem}
        onCancel={() => {
          setShowArchiveDialog(false);
          setItemToArchive(null);
        }}
      />
    </div>
  );
}

function SortablePostIt({
  itemId,
  children,
}: {
  itemId: number;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

