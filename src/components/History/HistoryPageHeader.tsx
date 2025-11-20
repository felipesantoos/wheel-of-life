import { ArrowLeft } from "lucide-react";

interface HistoryPageHeaderProps {
  onNavigate: () => void;
}

export default function HistoryPageHeader({
  onNavigate,
}: HistoryPageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onNavigate}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="text-gray-600 mt-1">
          View evolution of your life areas over time
        </p>
      </div>
    </div>
  );
}

