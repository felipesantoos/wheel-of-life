import { ActionItem } from "../types";
import { formatDate } from "../lib/utils";
import { CheckCircle2, Circle, PlayCircle, Trash2, Edit2 } from "lucide-react";
import { cn } from "../lib/utils";

interface ActionItemCardProps {
  item: ActionItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
}

export default function ActionItemCard({
  item,
  onEdit,
  onDelete,
  onStatusChange,
}: ActionItemCardProps) {
  const statusConfig = {
    todo: { icon: Circle, label: "To Do", color: "text-gray-400" },
    in_progress: { icon: PlayCircle, label: "In Progress", color: "text-blue-500" },
    done: { icon: CheckCircle2, label: "Done", color: "text-green-500" },
  };

  const priorityConfig = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || Circle;
  const statusColor =
    statusConfig[item.status as keyof typeof statusConfig]?.color || "text-gray-400";

  const isOverdue =
    item.deadline && item.status !== "done" && item.deadline * 1000 < Date.now();

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-4 border-l-4 transition-all",
        item.status === "done" && "opacity-75",
        isOverdue && "border-red-500",
        !isOverdue && item.status === "todo" && "border-gray-300",
        !isOverdue && item.status === "in_progress" && "border-blue-500",
        !isOverdue && item.status === "done" && "border-green-500"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={cn("w-5 h-5", statusColor)} />
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            {item.priority && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  priorityConfig[item.priority as keyof typeof priorityConfig] ||
                    priorityConfig.low
                )}
              >
                {item.priority.toUpperCase()}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Created: {formatDate(item.created_at)}</span>
            {item.deadline && (
              <span className={cn(isOverdue && "text-red-600 font-semibold")}>
                Deadline: {formatDate(item.deadline)}
              </span>
            )}
            {item.completed_at && (
              <span>Completed: {formatDate(item.completed_at)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onStatusChange && (
            <select
              value={item.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="custom-select-sm text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

