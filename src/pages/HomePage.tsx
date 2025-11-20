import { useMemo, useCallback } from "react";
import { Settings, History } from "lucide-react";

import LifeWheel from "../components/LifeWheel";
import { ActionItem, LifeArea, Page } from "../types";
import { useActionItemsManager } from "../hooks/useActionItemsManager";
import { ActionItemsPanel } from "../components/ActionItems/Panel";
import { PostItCard, SortablePostItCard } from "../components/ActionItems/PostItCard";
import { ActionItemModal } from "../components/ActionItems/ActionItemModal";
import { ExpandedItemModal } from "../components/ActionItems/ExpandedItemModal";
import { ConfirmArchiveDialog } from "../components/ActionItems/ConfirmArchiveDialog";

interface HomePageProps {
  onNavigate: (page: Page, data?: any) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const {
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
    handleSaveActionItem,
    closeActionItemModal,
    editingItem,
    requestArchiveActionItem,
    confirmArchiveActionItem,
    cancelArchiveAction,
    showArchiveDialog,
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
  } = useActionItemsManager({ onNavigate });

  const areaMap = useMemo(() => {
    const map = new Map<number, LifeArea>();
    areas.forEach((area) => map.set(area.id, area));
    return map;
  }, [areas]);

  const renderCard = useCallback(
    (item: ActionItem, draggable: boolean) => {
      const area = areaMap.get(item.area_id);
      const baseProps = {
        item,
        area,
        onPointerDown: handlePostItPointerDown,
        onPointerUp: handlePostItPointerUp,
        onDoubleClick: undefined,
      };

      return draggable ? (
        <SortablePostItCard key={item.id} itemId={item.id} {...baseProps} />
      ) : (
        <PostItCard key={item.id} {...baseProps} />
      );
    },
    [areaMap, handlePostItPointerDown, handlePostItPointerUp, openExpandedModal]
  );

  if (areasLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Wheel of Life!</h2>
          <p className="text-gray-600 mb-6">
            Create your first area to track different aspects of your life and visualize your progress.
          </p>
          <button
            onClick={() => onNavigate("manage")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            Create first area
          </button>
        </div>
      </div>
    );
  }

  const expandedArea = expandedItem ? areaMap.get(expandedItem.area_id) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wheel of Life</h1>
          <p className="text-gray-600 mt-1">Update scores by clicking on the chart or open the area details.</p>
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
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
          <LifeWheel areas={areas} scores={scores} onAreaClick={handleAreaClick} onScoreClick={handleScoreClick} size={500} />
          <p className="text-sm text-gray-600 mt-10 text-center">
            Click the chart to update scores or select the area name to view details.
          </p>
        </div>

        <ActionItemsPanel
          areas={areas}
          areaFilter={areaFilter}
          onAreaFilterChange={setAreaFilter}
          actionItemsLoading={actionItemsLoading}
          visibleItems={visibleItems}
          canReorder={canReorder}
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
          onCreateClick={openCreateModal}
          renderCard={renderCard}
        />
      </div>

      <ActionItemModal
        isOpen={showActionItemModal}
                areas={areas}
        editingItem={editingItem}
        onSave={handleSaveActionItem}
        onClose={closeActionItemModal}
        onArchive={editingItem ? () => requestArchiveActionItem(editingItem.id) : undefined}
      />

      {expandedItem && (
        <ExpandedItemModal
          item={expandedItem}
          area={expandedArea}
          isEditing={isExpandedEditing}
          draft={expandedDraft}
          onDraftChange={setExpandedDraft}
          onClose={closeExpandedModal}
          onSave={handleExpandedSave}
          onCancelEditing={handleExpandedCancelEditing}
          onStartEditing={() => setIsExpandedEditing(true)}
          onArchive={() => expandedItem && requestArchiveActionItem(expandedItem.id)}
          onEditInModal={openEditFromExpanded}
        />
      )}

      <ConfirmArchiveDialog isOpen={showArchiveDialog} onConfirm={confirmArchiveActionItem} onCancel={cancelArchiveAction} />
    </div>
  );
}
