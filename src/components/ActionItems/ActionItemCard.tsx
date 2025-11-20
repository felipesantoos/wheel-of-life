import { ActionItem } from "../../types";
import { formatDate, cn } from "../../lib/utils";
import { Edit2, Archive } from "lucide-react";

interface ActionItemCardProps {
  item: ActionItem;
  onEdit?: () => void;
  onArchive?: () => void;
}

export default function ActionItemCard({ item, onEdit, onArchive }: ActionItemCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-200 transition-all"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1 break-words">{item.title}</h3>
          <p className="text-xs text-gray-500">
            Created: {formatDate(item.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit action item"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Archive action item"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

