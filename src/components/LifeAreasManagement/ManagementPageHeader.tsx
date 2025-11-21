import { ArrowLeft, Plus, RotateCw } from "lucide-react";
import { type CSSProperties } from "react";

interface ManagementPageHeaderProps {
  onNavigate: () => void;
  onCreateClick: () => void;
  onResetClick: () => void;
}

export default function ManagementPageHeader({
  onNavigate,
  onCreateClick,
  onResetClick,
}: ManagementPageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onNavigate}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">Manage Life Areas</h1>
        <p className="text-gray-600 mt-1">
          Create, edit, and organize your life areas
        </p>
      </div>
      <div className="flex gap-2">
          <button
            onClick={onResetClick}
            className="relative px-4 py-2 text-white rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90 flex items-center gap-2"
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
            <span className="relative z-10">Reset Database</span>
          </button>
          <button
            onClick={onCreateClick}
            className="relative px-4 py-2 text-white rounded-lg transition-colors shadow-md overflow-hidden hover:opacity-90 flex items-center gap-2"
            style={{
              backgroundColor: "#2563eb",
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
            <span className="relative z-10">Create Area</span>
          </button>
        </div>
    </div>
  );
}

