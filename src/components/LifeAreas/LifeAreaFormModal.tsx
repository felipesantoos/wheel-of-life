import { useState, useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { LifeArea } from "../../types";

interface LifeAreaFormModalProps {
  area?: LifeArea;
  onSubmit: (name: string, description: string | undefined, color: string, order: number) => Promise<void>;
  onClose: () => void;
  maxOrder: number;
}

const DEFAULT_COLORS = [
  "#00ffff", // aqua
  "#000000", // black
  "#0000ff", // blue
  "#ff00ff", // fuchsia
  "#808080", // gray
  "#008000", // green
  "#00ff00", // lime
  "#800000", // maroon
  "#000080", // navy
  "#808000", // olive
  "#800080", // purple
  "#ff0000", // red
  "#c0c0c0", // silver
  "#008080", // teal
  "#ffffff", // white
  "#ffff00", // yellow
];

export default function LifeAreaFormModal({
  area,
  onSubmit,
  onClose,
  maxOrder,
}: LifeAreaFormModalProps) {
  const [name, setName] = useState(area?.name || "");
  const [description, setDescription] = useState(area?.description || "");
  const [color, setColor] = useState(area?.color || DEFAULT_COLORS[0]);
  const [order, setOrder] = useState(area?.order ?? maxOrder + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (containerRef.current) {
      const element = containerRef.current;
      element.style.animation = 'none';
      void element.offsetWidth;
      element.style.animation = 'paperOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined, color, order);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
    >
      <div
        className="fixed inset-0 bg-gray-900/20 pointer-events-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      />
      <div
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          transformOrigin: "center center",
          opacity: 0,
          transform: 'scale(0.7) rotate(-5deg)',
        } as CSSProperties}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {area ? "Edit Life Area" : "Create Life Area"}
          </h2>
          <button
            onClick={onClose}
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
                  className={`relative w-10 h-10 rounded-full border-2 transition-all overflow-hidden ${
                    color === c ? "border-gray-900 scale-110 shadow-md" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
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
                      borderWidth: "0 0 12px 12px",
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
                </button>
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
              onClick={onClose}
              className="relative flex-1 px-4 py-2 text-gray-700 rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90"
              style={{
                backgroundColor: "#f3f4f6",
              } as CSSProperties}
              disabled={isSubmitting}
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
              <span className="relative z-10">Cancel</span>
            </button>
            <button
              type="submit"
              className="relative flex-1 px-4 py-2 text-white rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#2563eb",
              } as CSSProperties}
              disabled={isSubmitting || !name.trim()}
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
              <span className="relative z-10">
                {isSubmitting ? "Saving..." : area ? "Update" : "Create"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

