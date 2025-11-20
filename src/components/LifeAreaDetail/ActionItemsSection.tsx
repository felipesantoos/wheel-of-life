import { useState } from "react";
import { ActionItem } from "../../types";
import ActionItemCard from "../ActionItems/ActionItemCard";
import ActionItemForm from "../ActionItems/ActionItemForm";
import { Plus } from "lucide-react";

interface ActionItemsSectionProps {
  areaId: number;
  items: ActionItem[];
  onCreateItem: (areaId: number, title: string) => Promise<void>;
  onUpdateItem: (itemId: number, title: string) => Promise<void>;
  onArchiveItem: (id: number) => void;
  onResetClick: () => void;
}

export default function ActionItemsSection({
  areaId,
  items,
  onCreateItem,
  onUpdateItem,
  onArchiveItem,
  onResetClick,
}: ActionItemsSectionProps) {
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

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

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Action Items</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onResetClick}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Reset Action Items
            </button>
          )}
          {!showActionItemForm && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowActionItemForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Action Item
            </button>
          )}
        </div>
      </div>

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
        <div className="space-y-3">
          {items.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onEdit={() => handleEditItem(item)}
              onArchive={() => onArchiveItem(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

