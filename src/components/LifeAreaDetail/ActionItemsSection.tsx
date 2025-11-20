import { useState, useRef, useCallback, type CSSProperties } from "react";
import { ActionItem, LifeArea } from "../../types";
import { PostItCard } from "../ActionItems/PostItCard";
import ActionItemForm from "../ActionItems/ActionItemForm";
import { Plus, RotateCw } from "lucide-react";

interface ActionItemsSectionProps {
  areaId: number;
  area: LifeArea;
  items: ActionItem[];
  onCreateItem: (areaId: number, title: string) => Promise<void>;
  onUpdateItem: (itemId: number, title: string) => Promise<void>;
  onArchiveItem: (id: number) => void;
  onResetClick: () => void;
  onOpenEditModal?: (item: ActionItem | null) => void;
  onOpenExpandedModal?: (item: ActionItem) => void;
}

type ClickInfo = { id: number; x: number; y: number; time: number };

export default function ActionItemsSection({
  areaId,
  area,
  items,
  onCreateItem,
  onUpdateItem,
  onArchiveItem,
  onResetClick,
  onOpenEditModal,
  onOpenExpandedModal,
}: ActionItemsSectionProps) {
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const clickInfoRef = useRef<ClickInfo | null>(null);
  const isDraggingRef = useRef(false);

  const handleCreateActionItem = async (areaId: number, title: string) => {
    await onCreateItem(areaId, title);
    setShowActionItemForm(false);
  };

  const handleUpdateActionItem = async (areaId: number, title: string) => {
    if (!editingItem) return;
    await onUpdateItem(editingItem.id, title);
    setEditingItem(null);
    setShowActionItemForm(false);
  };

  const handleEditItem = (item: ActionItem) => {
    setEditingItem(item);
    setShowActionItemForm(true);
  };

  const handleCancel = () => {
    setShowActionItemForm(false);
    setEditingItem(null);
  };

  const handlePostItPointerDown = useCallback((itemId: number, event: React.PointerEvent) => {
    if (event.button !== 0) return;
    clickInfoRef.current = {
      id: itemId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
    isDraggingRef.current = false;
  }, []);

  const handlePostItPointerUp = useCallback(
    (item: ActionItem, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      const info = clickInfoRef.current;
      clickInfoRef.current = null;
      if (!info || info.id !== item.id) return;
      if (isDraggingRef.current) return;
      const distance = Math.hypot(event.clientX - info.x, event.clientY - info.y);
      const duration = performance.now() - info.time;
      if (distance <= 5 && duration <= 300) {
        // Single click - open edit modal (post-it styled)
        if (onOpenEditModal) {
          onOpenEditModal(item);
        }
      }
    },
    [onOpenEditModal]
  );

  const handleDoubleClick = useCallback((item: ActionItem) => {
    if (onOpenExpandedModal) {
      onOpenExpandedModal(item);
    }
  }, [onOpenExpandedModal]);

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 h-full md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Action Items</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onResetClick}
              className="relative px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md overflow-hidden"
              style={{
                backgroundColor: "#dc2626",
              } as CSSProperties}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.2), transparent 65%), linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent 40%)",
                  opacity: 0.65,
                  mixBlendMode: "screen",
                } as CSSProperties}
              />
              <div
                className="absolute bottom-0 right-0 pointer-events-none"
                style={{
                  borderStyle: "solid",
                  borderWidth: "0 0 28px 28px",
                  borderColor: "transparent transparent rgba(15, 23, 42, 0.18) transparent",
                  opacity: 0.35,
                } as CSSProperties}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    "inset 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
                } as CSSProperties}
              />
              <RotateCw className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Reset</span>
            </button>
          )}
          {!showActionItemForm && (
            <button
              onClick={() => {
                if (onOpenEditModal) {
                  onOpenEditModal(null);
                } else {
                  setEditingItem(null);
                  setShowActionItemForm(true);
                }
              }}
              className="relative px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md overflow-hidden hover:opacity-90"
              style={{
                backgroundColor: area.color,
              } as CSSProperties}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.2), transparent 65%), linear-gradient(120deg, rgba(255, 255, 255, 0.15), transparent 40%)",
                  opacity: 0.65,
                  mixBlendMode: "screen",
                } as CSSProperties}
              />
              <div
                className="absolute bottom-0 right-0 pointer-events-none"
                style={{
                  borderStyle: "solid",
                  borderWidth: "0 0 28px 28px",
                  borderColor: "transparent transparent rgba(15, 23, 42, 0.18) transparent",
                  opacity: 0.35,
                } as CSSProperties}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    "inset 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
                } as CSSProperties}
              />
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Add Action Item</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {showActionItemForm ? (
          <div className="mb-6">
            <ActionItemForm
              item={editingItem || undefined}
              areaId={areaId}
              onSubmit={editingItem ? handleUpdateActionItem : handleCreateActionItem}
              onCancel={handleCancel}
            />
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No action items yet. Create your first one!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <PostItCard
                key={item.id}
                item={item}
                area={area}
                onPointerDown={handlePostItPointerDown}
                onPointerUp={handlePostItPointerUp}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

