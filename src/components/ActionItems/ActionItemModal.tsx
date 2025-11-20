import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, Save, Archive } from "lucide-react";

import { ActionItem, LifeArea } from "../../types";
import { getContrastTextColor } from "../../lib/utils";

interface ActionItemModalProps {
  isOpen: boolean;
  areas: LifeArea[];
  editingItem: ActionItem | null;
  onSave: (data: { title: string; areaId: number }) => Promise<boolean>;
  onClose: () => void;
  onArchive?: () => void;
}

export function ActionItemModal({ isOpen, areas, editingItem, onSave, onClose, onArchive }: ActionItemModalProps) {
  const [title, setTitle] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const areaButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setSelectedAreaId(editingItem.area_id);
    } else {
      setTitle("");
      setSelectedAreaId(areas[0]?.id ?? null);
    }
    setDropdownOpen(false);
  }, [areas, editingItem, isOpen]);

  useEffect(() => {
    if (dropdownOpen && areaButtonRef.current) {
      const rect = areaButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const element = containerRef.current;
      element.style.animation = 'none';
      void element.offsetWidth;
      element.style.animation = 'paperOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const currentArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0];
  const paperColor = currentArea?.color || "#fef9c3";
  const textColor = currentArea ? getContrastTextColor(currentArea.color) : "#1f2937";
  const trimmedTitle = title.trim();

  const hasChanges = editingItem
    ? trimmedTitle !== editingItem.title.trim() || (selectedAreaId !== null && selectedAreaId !== editingItem.area_id)
    : trimmedTitle.length > 0 && selectedAreaId !== null;

  const handleSave = async () => {
    if (!selectedAreaId) return;
    const success = await onSave({ title: trimmedTitle, areaId: selectedAreaId });
    if (success) {
      setDropdownOpen(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[100] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex items-center justify-center w-full max-w-3xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={containerRef}
          className="relative origin-center"
          onClick={(e) => {
            e.stopPropagation();
            if (dropdownOpen && !(e.target as HTMLElement).closest(".area-dropdown")) {
              setDropdownOpen(false);
            }
          }}
          style={{
            transformOrigin: "center center",
            zIndex: 101,
            opacity: 0,
            transform: 'scale(0.7) rotate(-5deg)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 transition-colors z-10 p-1 opacity-70 hover:opacity-100"
            style={{ color: textColor }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            className="post-it post-it--large w-[360px] aspect-square sm:w-[420px]"
            style={{ "--post-it-color": paperColor, "--post-it-text": textColor } as CSSProperties}
          >
            <div className="post-it__paper flex h-full flex-col gap-4 p-5 sm:p-6">
              <div className="flex-1 overflow-y-auto pr-2">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-full bg-transparent border-0 rounded-sm p-3 text-xl font-semibold leading-snug resize-none focus:outline-none focus:ring-0 placeholder:opacity-60"
                  style={{ 
                    color: textColor,
                  } as CSSProperties}
                  maxLength={80}
                  autoFocus
                  placeholder={editingItem ? "" : "Enter action item title..."}
                />
              </div>
              <div className="mt-auto flex items-center justify-between text-[11px] uppercase tracking-wide opacity-80 mb-2 px-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSave();
                    }}
                    disabled={!hasChanges}
                    className="inline-flex items-center justify-center transition-colors disabled:opacity-30 p-1 opacity-70 hover:opacity-100"
                    style={{ color: textColor }}
                    title="Save"
                  >
                    <Save className="w-6 h-6" />
                  </button>
                  {editingItem && !!onArchive && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onArchive();
                      }}
                      className="inline-flex items-center justify-center transition-colors p-1 opacity-70 hover:opacity-100"
                      style={{ color: textColor }}
                      title="Archive"
                    >
                      <Archive className="w-6 h-6" />
                    </button>
                  )}
                  <span className="text-[10px] opacity-50" style={{ color: textColor }}>{title.length}/80</span>
                </div>
                <div className="relative" style={{ zIndex: 1000, overflow: "visible" }}>
                  <button
                    ref={areaButtonRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((open) => !open);
                    }}
                    className="text-[11px] uppercase tracking-wide opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
                    style={{ color: textColor }}
                  >
                    {currentArea?.name || "Select Area"}
                    <svg
                      className="w-3 h-3 transition-transform"
                      style={{
                        transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        opacity: 0.6,
                      }}
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
                    </svg>
                  </button>
                {dropdownOpen && dropdownPosition
                  ? createPortal(
                    <div
                      className="area-dropdown fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-48 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        zIndex: 99999,
                        position: "fixed",
                        top: `${dropdownPosition.top}px`,
                        right: `${dropdownPosition.right}px`,
                        width: "auto",
                        minWidth: "120px",
                        maxWidth: "200px",
                      }}
                    >
                      {areas.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAreaId(area.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            selectedAreaId === area.id ? "bg-gray-100 font-medium" : ""
                          }`}
                          style={{ color: selectedAreaId === area.id ? area.color : "#1f2937" }}
                        >
                          {area.name}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )
                  : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

