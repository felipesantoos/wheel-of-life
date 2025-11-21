import { useState } from "react";
import { useLifeAreas, useAllLatestScores, useResetAllData } from "../lib/hooks";
import { LifeArea, Page } from "../types";
import LifeAreaFormModal from "../components/LifeAreas/LifeAreaFormModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ManagementPageHeader from "../components/LifeAreasManagement/ManagementPageHeader";
import ActiveAreasSection from "../components/LifeAreasManagement/ActiveAreasSection";
import ArchivedAreasSection from "../components/LifeAreasManagement/ArchivedAreasSection";

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
      <ManagementPageHeader
        onNavigate={() => onNavigate("home")}
        onCreateClick={() => {
          setEditingArea(null);
          setShowForm(true);
        }}
        onResetClick={() => setShowResetDialog(true)}
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-4">
        <ActiveAreasSection
          areas={activeAreas}
          scores={scores}
          onAreaClick={(areaId) => onNavigate("detail", { areaId })}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onCreateFirst={() => setShowForm(true)}
        />

        <ArchivedAreasSection
          areas={archivedAreas}
          onRestore={handleRestore}
        />
      </div>

      {showForm && (
        <LifeAreaFormModal
          area={editingArea || undefined}
          onSubmit={editingArea ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingArea(null);
          }}
          maxOrder={maxOrder}
        />
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

