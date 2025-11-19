import { useState } from "react";
import { useLifeAreas, useAllLatestScores, useResetAllData } from "../lib/hooks";
import { LifeArea, Page } from "../types";
import LifeAreaCard from "../components/LifeAreaCard";
import LifeAreaForm from "../components/LifeAreaForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { ArrowLeft, Plus, Edit2, Archive, RotateCcw, RotateCw } from "lucide-react";

interface LifeAreasManagementPageProps {
  onNavigate: (page: Page, data?: any) => void;
}

export default function LifeAreasManagementPage({
  onNavigate,
}: LifeAreasManagementPageProps) {
  const { areas, createArea, updateArea, deleteArea, restoreArea, refresh: refreshAreas } = useLifeAreas(true);
  const { scores, refresh: refreshScores } = useAllLatestScores();
  const { resetAllData } = useResetAllData();
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<LifeArea | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const activeAreas = areas.filter((a) => a.is_active);
  const archivedAreas = areas.filter((a) => !a.is_active);

  const maxOrder = activeAreas.length > 0
    ? Math.max(...activeAreas.map((a) => a.order))
    : 0;

  const handleCreate = async (
    name: string,
    description: string | undefined,
    color: string,
    order: number
  ) => {
    await createArea(name, description, color, order);
    setShowForm(false);
  };

  const handleUpdate = async (
    name: string,
    description: string | undefined,
    color: string,
    order: number
  ) => {
    if (!editingArea) return;
    await updateArea(editingArea.id, name, description, color, order);
    setEditingArea(null);
    setShowForm(false);
  };

  const handleEdit = (area: LifeArea) => {
    setEditingArea(area);
    setShowForm(true);
  };

  const handleArchive = async (id: number) => {
    if (confirm("Are you sure you want to archive this area? It will be hidden from the wheel.")) {
      await deleteArea(id);
    }
  };

  const handleRestore = async (id: number) => {
    await restoreArea(id);
  };

  const handleResetAll = async () => {
    try {
      await resetAllData();
      await refreshAreas();
      await refreshScores();
      setShowResetDialog(false);
    } catch (err) {
      // Error already handled by hook
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate("home")}
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
              onClick={() => setShowResetDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reset Database
            </button>
            <button
              onClick={() => {
                setEditingArea(null);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Area
            </button>
          </div>
        )}
      </div>

      {showForm ? (
        <div className="flex-1 overflow-y-auto">
          <LifeAreaForm
            area={editingArea || undefined}
            onSubmit={editingArea ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingArea(null);
            }}
            maxOrder={maxOrder}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Active Areas */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Areas ({activeAreas.length})
            </h2>
            {activeAreas.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">No active areas yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Area
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAreas.map((area) => {
                  const score = scores.find((s) => s.area_id === area.id);
                  return (
                    <div key={area.id} className="relative">
                      <LifeAreaCard
                        area={area}
                        currentScore={score?.value}
                        onClick={() => onNavigate("detail", { areaId: area.id })}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(area);
                          }}
                          className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(area.id);
                          }}
                          className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-orange-600 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Archived Areas */}
          {archivedAreas.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Archived Areas ({archivedAreas.length})
                </h2>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showArchived ? "Hide" : "Show"} Archived
                </button>
              </div>
              {showArchived && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedAreas.map((area) => (
                    <div key={area.id} className="relative opacity-60">
                      <LifeAreaCard area={area} />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleRestore(area.id)}
                          className="p-1.5 bg-white rounded shadow-sm text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showResetDialog}
        title="Reset Database"
        message="Are you sure you want to reset the entire database? This action will delete all areas, scores, and action items. This action cannot be undone."
        confirmText="Reset All"
        cancelText="Cancel"
        onConfirm={handleResetAll}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  );
}

