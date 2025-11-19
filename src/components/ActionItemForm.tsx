import { useState, useEffect } from "react";
import { ActionItem, LifeArea } from "../types";
import { X } from "lucide-react";

const MAX_TITLE_LENGTH = 80;

interface ActionItemFormProps {
  item?: ActionItem;
  areaId?: number;
  areas?: LifeArea[];
  showAreaSelector?: boolean;
  showHeader?: boolean;
  showCardWrapper?: boolean;
  onSubmit: (areaId: number, title: string) => Promise<void>;
  onCancel: () => void;
}

export default function ActionItemForm({
  item,
  areaId,
  areas = [],
  showAreaSelector = false,
  showHeader = true,
  showCardWrapper = true,
  onSubmit,
  onCancel,
}: ActionItemFormProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>(areaId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (showAreaSelector && !selectedAreaId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const finalAreaId = showAreaSelector ? selectedAreaId : areaId;
      if (!finalAreaId) {
        return;
      }

      await onSubmit(finalAreaId, title.trim());
      if (!item) {
        setTitle("");
        if (showAreaSelector) {
          setSelectedAreaId(undefined);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showAreaSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area *
          </label>
          <select
            value={selectedAreaId || ""}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedAreaId(value ? Number(value) : undefined);
            }}
            className="custom-select w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            required
          >
            <option value="">Select an area...</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          maxLength={MAX_TITLE_LENGTH}
          placeholder="e.g., Exercise 3 times per week"
        />
        <p className="text-xs text-gray-500 mt-1">
          {title.length}/{MAX_TITLE_LENGTH} characters
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
          disabled={isSubmitting || !title.trim() || (showAreaSelector && !selectedAreaId)}
        >
          {isSubmitting ? "Saving..." : item ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );

  if (showCardWrapper) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {item ? "Edit Action Item" : "Create Action Item"}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {formContent}
      </div>
    );
  }

  return (
    <>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? "Edit Action Item" : "Create Action Item"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {formContent}
    </>
  );
}

