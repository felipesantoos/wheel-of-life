import { ArrowLeft, RotateCw } from "lucide-react";
import { LifeArea } from "../../types";

interface DetailPageHeaderProps {
  area: LifeArea;
  onNavigate: () => void;
  onResetClick: () => void;
}

export default function DetailPageHeader({
  area,
  onNavigate,
  onResetClick,
}: DetailPageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onNavigate}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">{area.name}</h1>
        {area.description && (
          <p className="text-gray-600 mt-1">{area.description}</p>
        )}
      </div>
      <button
        onClick={onResetClick}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <RotateCw className="w-4 h-4" />
        Reset Area Data
      </button>
    </div>
  );
}

