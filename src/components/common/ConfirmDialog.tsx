import { X } from "lucide-react";
import { type CSSProperties } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-[110]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="relative px-4 py-2 text-gray-700 rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90"
            style={{
              backgroundColor: "#f3f4f6",
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
            <span className="relative z-10">{cancelText}</span>
          </button>
          <button
            onClick={onConfirm}
            className="relative px-4 py-2 text-white rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90"
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
            <span className="relative z-10">{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

