import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useScores, useActionItems, useResetAreaData, useResetAreaScores, useResetAreaActionItems } from "../lib/hooks";
import { LifeArea, ActionItem, Page } from "../types";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DetailPageHeader from "../components/LifeAreaDetail/DetailPageHeader";
import CurrentScoreSection from "../components/LifeAreaDetail/CurrentScoreSection";
import ScoreHistorySection from "../components/LifeAreaDetail/ScoreHistorySection";
import ActionItemsSection from "../components/LifeAreaDetail/ActionItemsSection";

interface LifeAreaDetailPageProps {
  areaId: number;
  onNavigate: (page: Page, data?: any) => void;
}

export default function LifeAreaDetailPage({
  areaId,
  onNavigate,
}: LifeAreaDetailPageProps) {
  const [area, setArea] = useState<LifeArea | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showResetScoresDialog, setShowResetScoresDialog] = useState(false);
  const [showResetActionItemsDialog, setShowResetActionItemsDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [itemToArchive, setItemToArchive] = useState<number | null>(null);

  const { scores, latestScore, createScore, refresh: refreshScores } = useScores(areaId);
  const { items, createItem, updateItem, archiveItem, refresh: refreshItems } = useActionItems(areaId);
  const { resetAreaData } = useResetAreaData();
  const { resetAreaScores } = useResetAreaScores();
  const { resetAreaActionItems } = useResetAreaActionItems();

  useEffect(() => {
    const loadArea = async () => {
      try {
        const areaData = await invoke<LifeArea>("get_life_area", { id: areaId });
        setArea(areaData);
      } catch (err) {
        console.error("Failed to load area:", err);
      }
    };
    loadArea();
  }, [areaId]);

  const handleCreateScore = async (value: number) => {
    await createScore(areaId, value);
  };

  const handleCreateActionItem = async (areaId: number, title: string) => {
    await createItem(areaId, title);
  };

  const handleUpdateActionItem = async (itemId: number, title: string) => {
    await updateItem(itemId, title);
  };

  const handleArchiveItem = async (id: number) => {
    await archiveItem(id);
  };

  const requestArchiveItem = (id: number) => {
    setItemToArchive(id);
    setShowArchiveDialog(true);
  };

  const confirmArchiveItem = async () => {
    if (itemToArchive === null) return;
    const id = itemToArchive;
    setShowArchiveDialog(false);
    setItemToArchive(null);
    await handleArchiveItem(id);
  };

  const handleResetArea = async () => {
    try {
      await resetAreaData(areaId);
      await refreshScores();
      await refreshItems();
      setShowResetDialog(false);
    } catch (err) {
      // Error already handled by hook
    }
  };

  const handleResetScores = async () => {
    try {
      await resetAreaScores(areaId);
      await refreshScores();
      setShowResetScoresDialog(false);
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleResetActionItems = async () => {
    try {
      await resetAreaActionItems(areaId);
      await refreshItems();
      setShowResetActionItemsDialog(false);
    } catch (err) {
      // toast handled in hook
    }
  };

  if (!area) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading area...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DetailPageHeader
        area={area}
        onNavigate={() => onNavigate("home")}
        onResetClick={() => setShowResetDialog(true)}
      />

      <div className="flex-1 overflow-y-auto space-y-6">
        <CurrentScoreSection
          area={area}
          latestScore={latestScore}
          onCreateScore={handleCreateScore}
        />

        <ScoreHistorySection
          area={area}
          scores={scores}
          onResetClick={() => setShowResetScoresDialog(true)}
        />

        <ActionItemsSection
          areaId={areaId}
          items={items}
          onCreateItem={handleCreateActionItem}
          onUpdateItem={handleUpdateActionItem}
          onArchiveItem={requestArchiveItem}
          onResetClick={() => setShowResetActionItemsDialog(true)}
        />
      </div>

      <ConfirmDialog
        isOpen={showResetDialog}
        title="Reset Area Data"
        message={`Are you sure you want to reset all data for the area "${area.name}"? This action will delete all scores and action items for this area. The area itself will be kept. This action cannot be undone.`}
        confirmText="Reset Data"
        cancelText="Cancel"
        onConfirm={handleResetArea}
        onCancel={() => setShowResetDialog(false)}
      />
      <ConfirmDialog
        isOpen={showResetScoresDialog}
        title="Reset Score History"
        message={`This will delete all recorded scores for "${area.name}". Action items will be kept. This action cannot be undone.`}
        confirmText="Reset Scores"
        cancelText="Cancel"
        onConfirm={handleResetScores}
        onCancel={() => setShowResetScoresDialog(false)}
      />
      <ConfirmDialog
        isOpen={showResetActionItemsDialog}
        title="Reset Action Items"
        message={`This will delete all action items for "${area.name}". Score history will be kept. This action cannot be undone.`}
        confirmText="Reset Action Items"
        cancelText="Cancel"
        onConfirm={handleResetActionItems}
        onCancel={() => setShowResetActionItemsDialog(false)}
      />
      <ConfirmDialog
        isOpen={showArchiveDialog}
        title="Archive Post-it"
        message="Are you sure you want to archive this post-it? It will be hidden from the main list."
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={confirmArchiveItem}
        onCancel={() => {
          setShowArchiveDialog(false);
          setItemToArchive(null);
        }}
      />
    </div>
  );
}

