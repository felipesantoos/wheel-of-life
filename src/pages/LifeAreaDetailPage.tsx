import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useScores, useActionItems, useResetAreaData, useResetAreaScores, useResetAreaActionItems } from "../lib/hooks";
import { LifeArea, ActionItem, Page } from "../types";
import ScoreForm from "../components/ScoreForm";
import ScoreHistoryChart from "../components/ScoreHistoryChart";
import ActionItemCard from "../components/ActionItemCard";
import ActionItemForm from "../components/ActionItemForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { ArrowLeft, Plus, RotateCw } from "lucide-react";
import { formatDate } from "../lib/utils";

interface LifeAreaDetailPageProps {
  areaId: number;
  onNavigate: (page: Page, data?: any) => void;
}

export default function LifeAreaDetailPage({
  areaId,
  onNavigate,
}: LifeAreaDetailPageProps) {
  const [area, setArea] = useState<LifeArea | null>(null);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showResetScoresDialog, setShowResetScoresDialog] = useState(false);
  const [showResetActionItemsDialog, setShowResetActionItemsDialog] = useState(false);

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
    setShowScoreForm(false);
  };

  const handleCreateActionItem = async (areaId: number, title: string) => {
    await createItem(areaId, title);
    setShowActionItemForm(false);
  };

  const handleUpdateActionItem = async (_areaId: number, title: string) => {
    if (!editingItem) return;
    await updateItem(editingItem.id, title);
    setEditingItem(null);
  };

  const handleEditItem = (item: ActionItem) => {
    setEditingItem(item);
    setShowActionItemForm(true);
  };

  const handleArchiveItem = async (id: number) => {
    await archiveItem(id);
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => onNavigate("home")}
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
          onClick={() => setShowResetDialog(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Reset Area Data
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Current Score Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Score</h2>
            {!showScoreForm && (
              <button
                onClick={() => setShowScoreForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Record Score
              </button>
            )}
          </div>

          {showScoreForm ? (
            <div className="max-w-md">
              <ScoreForm
                onSubmit={handleCreateScore}
                currentScore={latestScore?.value}
              />
              <button
                onClick={() => setShowScoreForm(false)}
                className="mt-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              {latestScore ? (
                <div className="flex items-center gap-4">
                  <div
                    className="text-6xl font-bold"
                    style={{ color: area.color }}
                  >
                    {latestScore.value}
                  </div>
                  <div>
                    <p className="text-gray-600">out of 10</p>
                    <p className="text-sm text-gray-500">
                      Recorded: {formatDate(latestScore.recorded_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No score recorded yet</p>
              )}
            </div>
          )}
        </section>

        {/* Score History Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Score History</h2>
            {scores.length > 0 && (
              <button
                onClick={() => setShowResetScoresDialog(true)}
                className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reset Score History
              </button>
            )}
          </div>
          <ScoreHistoryChart scores={scores} />
          {scores.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {scores.map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">
                    {formatDate(score.recorded_at)}
                  </span>
                  <span className="font-semibold" style={{ color: area.color }}>
                    {score.value}/10
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Action Items Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Action Items</h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={() => setShowResetActionItemsDialog(true)}
                  className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset Action Items
                </button>
              )}
              {!showActionItemForm && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowActionItemForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Action Item
                </button>
              )}
            </div>
          </div>

          {showActionItemForm ? (
            <div className="mb-6">
              <ActionItemForm
                item={editingItem || undefined}
                areaId={areaId}
                onSubmit={editingItem ? handleUpdateActionItem : handleCreateActionItem}
                onCancel={() => {
                  setShowActionItemForm(false);
                  setEditingItem(null);
                }}
              />
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No action items yet. Create your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item)}
                  onArchive={() => handleArchiveItem(item.id)}
                />
              ))}
            </div>
          )}
        </section>
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
    </div>
  );
}

