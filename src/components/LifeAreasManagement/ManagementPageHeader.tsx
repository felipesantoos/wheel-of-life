import { ArrowLeft, Plus, RotateCw } from "lucide-react";

interface ManagementPageHeaderProps {
  onNavigate: () => void;
  onCreateClick: () => void;
  onResetClick: () => void;
  showForm: boolean;
}

export default function ManagementPageHeader({
  onNavigate,
  onCreateClick,
  onResetClick,
  showForm,
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
      {!showForm && (
        <div className="flex gap-2">
          <button
            onClick={onResetClick}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Reset Database
          </button>
          <button
            onClick={onCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Area
          </button>
        </div>
      )}
    </div>
  );
}

