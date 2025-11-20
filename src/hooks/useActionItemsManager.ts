import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { DndContextProps, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { useLifeAreas, useAllLatestScores, useAllActionItems } from "../lib/hooks";
import { ActionItem, LifeArea, Page } from "../types";

type ClickInfo = { id: number; x: number; y: number; time: number };

export interface UseActionItemsManagerResult {
  areas: LifeArea[];
  areasLoading: boolean;
  scores: ReturnType<typeof useAllLatestScores>["scores"];
  handleAreaClick: (area: LifeArea) => void;
  handleScoreClick: (areaId: number, score: number) => Promise<void>;
  areaFilter: number | undefined;
  setAreaFilter: (value: number | undefined) => void;
  visibleItems: ActionItem[];
  actionItemsLoading: boolean;
  canReorder: boolean;
  sensors: DndContextProps["sensors"];
  handleDragStart: () => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  handleDragCancel: () => void;
  showActionItemModal: boolean;
  openCreateModal: () => void;
  openEditModal: (item: ActionItem) => void;
  closeActionItemModal: () => void;
  handleSaveActionItem: (payload: { title: string; areaId: number }) => Promise<boolean>;
  editingItem: ActionItem | null;
  isReordering: boolean;
  showArchiveDialog: boolean;
  requestArchiveActionItem: (itemId: number) => void;
  confirmArchiveActionItem: () => Promise<void>;
  cancelArchiveAction: () => void;
  handlePostItPointerDown: (itemId: number, event: React.PointerEvent) => void;
  handlePostItPointerUp: (item: ActionItem, event: React.PointerEvent) => void;
  expandedItem: ActionItem | null;
  expandedDraft: string;
  setExpandedDraft: (value: string) => void;
  isExpandedEditing: boolean;
  setIsExpandedEditing: (value: boolean) => void;
  openExpandedModal: (item: ActionItem) => void;
  closeExpandedModal: () => void;
  handleExpandedSave: () => Promise<void>;
  handleExpandedCancelEditing: () => void;
  openEditFromExpanded: () => void;
}

interface UseActionItemsManagerOptions {
  onNavigate: (page: Page, data?: any) => void;
}

export function useActionItemsManager({ onNavigate }: UseActionItemsManagerOptions): UseActionItemsManagerResult {
  const { areas, loading: areasLoading } = useLifeAreas(false);
  const { scores, refresh: refreshScores } = useAllLatestScores();
  const {
    items: actionItems,
    loading: actionItemsLoading,
    refresh: refreshActionItems,
    reorder: reorderActionItems,
  } = useAllActionItems();

  const [areaFilter, setAreaFilter] = useState<number | undefined>(undefined);
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [orderedItems, setOrderedItems] = useState<ActionItem[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [isDraggingPostIt, setIsDraggingPostIt] = useState(false);
  const clickInfoRef = useRef<ClickInfo | null>(null);
  const [expandedItem, setExpandedItem] = useState<ActionItem | null>(null);
  const [isExpandedEditing, setIsExpandedEditing] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState("");

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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

  useEffect(() => {
    if (!showActionItemModal) {
      setEditingItem(null);
    }
  }, [showActionItemModal]);

  useEffect(() => {
    const sorted = [...actionItems].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    setOrderedItems(sorted);
  }, [actionItems]);

  const visibleItems = useMemo(() => {
    if (!areaFilter) return orderedItems;
    return orderedItems.filter((item) => item.area_id === areaFilter);
  }, [orderedItems, areaFilter]);

  const canReorder =
    !areaFilter && !actionItemsLoading && visibleItems.length > 1 && !isReordering && !expandedItem;

  const handleAreaClick = useCallback(
    (area: LifeArea) => {
      onNavigate("detail", { areaId: area.id });
    },
    [onNavigate]
  );

  const handleScoreClick = useCallback(
    async (areaId: number, score: number) => {
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
    },
    [refreshScores]
  );

  const openCreateModal = useCallback(() => {
    setEditingItem(null);
    setShowActionItemModal(true);
  }, []);

  const openEditModal = useCallback((item: ActionItem) => {
    setEditingItem(item);
    setShowActionItemModal(true);
  }, []);

  const closeActionItemModal = useCallback(() => {
    setShowActionItemModal(false);
    setEditingItem(null);
  }, []);

  const handleCreateActionItem = useCallback(
    async (areaId: number, title: string) => {
      try {
        await invoke("create_action_item", { areaId, title });
        await refreshActionItems();
        toast.success("Action item created successfully", {
          id: `create-item-${Date.now()}`,
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create action item";
        toast.error(message, {
          id: `create-item-error-${Date.now()}`,
        });
        return false;
      }
    },
    [refreshActionItems]
  );

  const updateActionItemTitle = useCallback(
    async (itemId: number, title: string) => {
      try {
        await invoke("update_action_item", { id: itemId, title });
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
    },
    [refreshActionItems]
  );

  const handleSaveActionItem = useCallback(
    async ({ title, areaId }: { title: string; areaId: number }) => {
      const trimmed = title.trim();
      if (!trimmed) {
        toast.error("Title cannot be empty");
        return false;
      }

      if (editingItem) {
        const titleChanged = trimmed !== editingItem.title.trim();
        const areaChanged = areaId !== editingItem.area_id;

        let titleSuccess = true;
        if (titleChanged) {
          titleSuccess = await updateActionItemTitle(editingItem.id, trimmed);
        }

        if (titleSuccess && areaChanged) {
          try {
            await invoke("update_action_item_area", {
              id: editingItem.id,
              areaId,
            });
            await refreshActionItems();
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update area";
            toast.error(message);
            return false;
          }
        }

        if (titleSuccess) {
          closeActionItemModal();
        }
        return titleSuccess || areaChanged;
      }

      const success = await handleCreateActionItem(areaId, trimmed);
      if (success) {
        closeActionItemModal();
      }
      return success;
    },
    [closeActionItemModal, editingItem, handleCreateActionItem, refreshActionItems, updateActionItemTitle]
  );

  const handleDragStart = useCallback(() => {
    setIsDraggingPostIt(true);
  }, []);

  const handleDragCancel = useCallback(() => {
    setIsDraggingPostIt(false);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
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
    },
    [canReorder, orderedItems, refreshActionItems, reorderActionItems]
  );

  const openExpandedModal = useCallback((item: ActionItem) => {
    setExpandedItem(item);
    setExpandedDraft(item.title);
    setIsExpandedEditing(false);
  }, []);

  const handlePostItPointerDown = useCallback((itemId: number, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    clickInfoRef.current = {
      id: itemId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  }, []);

  const handlePostItPointerUp = useCallback(
    (item: ActionItem, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      const info = clickInfoRef.current;
      clickInfoRef.current = null;
      if (!info || info.id !== item.id) return;
      if (isDraggingPostIt) return;
      const distance = Math.hypot(event.clientX - info.x, event.clientY - info.y);
      const duration = performance.now() - info.time;
      if (distance <= 5 && duration <= 300) {
        openEditModal(item);
      }
    },
    [isDraggingPostIt, openEditModal]
  );

  const requestArchiveActionItem = useCallback((itemId: number) => {
    setItemToArchive(itemId);
    setShowArchiveDialog(true);
  }, []);

  const confirmArchiveActionItem = useCallback(async () => {
    if (itemToArchive === null) return;
    const itemId = itemToArchive;
    setShowArchiveDialog(false);
    setItemToArchive(null);

    if (editingItem?.id === itemId) {
      closeActionItemModal();
    }
    if (expandedItem?.id === itemId) {
      setExpandedItem(null);
    }

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
  }, [closeActionItemModal, editingItem, expandedItem, itemToArchive, refreshActionItems]);

  const cancelArchiveAction = useCallback(() => {
    setShowArchiveDialog(false);
    setItemToArchive(null);
  }, []);

  const closeExpandedModal = useCallback(() => {
    setExpandedItem(null);
    setIsExpandedEditing(false);
    setExpandedDraft("");
  }, []);

  const handleExpandedSave = useCallback(async () => {
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
  }, [expandedDraft, expandedItem, updateActionItemTitle]);

  const handleExpandedCancelEditing = useCallback(() => {
    if (expandedItem) {
      setExpandedDraft(expandedItem.title);
    }
    setIsExpandedEditing(false);
  }, [expandedItem]);

  const openEditFromExpanded = useCallback(() => {
    if (!expandedItem) return;
    setEditingItem(expandedItem);
    setShowActionItemModal(true);
    closeExpandedModal();
  }, [closeExpandedModal, expandedItem]);

  return {
    areas,
    areasLoading,
    scores,
    handleAreaClick,
    handleScoreClick,
    areaFilter,
    setAreaFilter,
    visibleItems,
    actionItemsLoading,
    canReorder,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    showActionItemModal,
    openCreateModal,
    openEditModal,
    closeActionItemModal,
    handleSaveActionItem,
    editingItem,
    isReordering,
    showArchiveDialog,
    requestArchiveActionItem,
    confirmArchiveActionItem,
    cancelArchiveAction,
    handlePostItPointerDown,
    handlePostItPointerUp,
    expandedItem,
    expandedDraft,
    setExpandedDraft,
    isExpandedEditing,
    setIsExpandedEditing,
    openExpandedModal,
    closeExpandedModal,
    handleExpandedSave,
    handleExpandedCancelEditing,
    openEditFromExpanded,
  };
}

