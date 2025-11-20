import { useState, useEffect } from "react";
import { LifeArea } from "../../types";
import { X } from "lucide-react";

interface LifeAreaFormProps {
  area?: LifeArea;
  onSubmit: (name: string, description: string | undefined, color: string, order: number) => Promise<void>;
  onCancel: () => void;
  maxOrder: number;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // orange
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

export default function LifeAreaForm({
  area,
  onSubmit,
  onCancel,
  maxOrder,
}: LifeAreaFormProps) {
  const [name, setName] = useState(area?.name || "");
  const [description, setDescription] = useState(area?.description || "");
  const [color, setColor] = useState(area?.color || DEFAULT_COLORS[0]);
  const [order, setOrder] = useState(area?.order ?? maxOrder + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (area) {
      setName(area.name);
      setDescription(area.description || "");
      setColor(area.color);
      setOrder(area.order);
    } else {
      setName("");
      setDescription("");
      setColor(DEFAULT_COLORS[0]);
      setOrder(maxOrder + 1);
    }
  }, [area, maxOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined, color, order);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {area ? "Edit Life Area" : "Create Life Area"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="e.g., Health, Finance, Relationships"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  color === c ? "border-gray-900 scale-110" : "border-gray-300"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-2 w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Lower numbers appear first in the wheel
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Saving..." : area ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

