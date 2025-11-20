import { useEffect, useRef } from "react";
import { Edit2, Archive, X, Save } from "lucide-react";
import { ActionItem, LifeArea } from "../../types";
import { getContrastTextColor } from "../../lib/utils";

interface ExpandedItemModalProps {
  item: ActionItem | null;
  area?: LifeArea | null;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onCancelEditing: () => void;
  onStartEditing: () => void;
  onArchive: () => void;
  onEditInModal: () => void;
}

export function ExpandedItemModal({
  item,
  area,
  isEditing,
  draft,
  onDraftChange,
  onClose,
  onSave,
  onCancelEditing,
  onStartEditing,
  onArchive,
  onEditInModal,
}: ExpandedItemModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item && containerRef.current) {
      const element = containerRef.current;
      element.style.animation = 'none';
      void element.offsetWidth;
      element.style.animation = 'paperOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }
  }, [item]);

  if (!item) return null;

  const paperColor = area?.color || "#fef9c3";
  const paperTheme = {
    "--post-it-color": paperColor,
    "--post-it-text": getContrastTextColor(paperColor),
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-center w-full max-w-3xl">
        <div 
          ref={containerRef}
          className="relative" 
          onClick={(e) => e.stopPropagation()}
          style={{
            transformOrigin: 'center center',
            opacity: 0,
            transform: 'scale(0.7) rotate(-5deg)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute -top-5 -right-5 bg-black/70 text-white rounded-full p-2 hover:bg-black transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="post-it post-it--large group w-[360px] h-[360px] sm:w-[420px] sm:h-[420px]" style={paperTheme}>
            <div className="post-it__paper flex h-full flex-col gap-4 p-5 sm:p-6">
              <div className="flex-1 overflow-y-auto pr-2">
                {isEditing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    className="w-full h-full bg-transparent border border-white/40 rounded-sm p-3 text-xl font-semibold leading-snug resize-none focus:outline-none focus:ring-2 focus:ring-white/70 placeholder-white/60"
                    maxLength={80}
                    autoFocus
                  />
                ) : (
                  <p className="text-xl font-semibold whitespace-pre-wrap break-words leading-snug">{item?.title || ''}</p>
                )}
              </div>
              <div className="mt-auto flex items-center justify-end text-[11px] uppercase tracking-wide opacity-80 mb-2 mr-3">
                <span>{area?.name || "Unknown Area"}</span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start gap-2 px-5 py-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-95 group-hover:pointer-events-auto" style={{ backgroundColor: "transparent" }}>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSave();
                      }}
                      className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCancelEditing();
                      }}
                      className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/25 px-4 py-1.5 text-xs text-white transition-colors hover:bg-white/45"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Editar ação"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartEditing();
                      }}
                      className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      title="Edit action item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Arquivar ação"
                      onClick={(event) => {
                        event.stopPropagation();
                        onArchive();
                      }}
                      className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      title="Archive action item"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Editar no modal principal"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditInModal();
                      }}
                      className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      title="Open edit modal"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

