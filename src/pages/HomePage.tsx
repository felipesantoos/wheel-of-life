import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLifeAreas, useAllLatestScores, useAllActionItems } from "../lib/hooks";
import LifeWheel from "../components/LifeWheel";
import ActionItemForm from "../components/ActionItemForm";
import { LifeArea, ActionItem } from "../types";
import { Settings, History, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface HomePageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { areas, loading } = useLifeAreas(false);
  const { scores, refresh: refreshScores } = useAllLatestScores();
  const [areaFilter, setAreaFilter] = useState<number | undefined>(undefined);
  const { items: actionItems, loading: actionItemsLoading, refresh: refreshActionItems } = useAllActionItems(areaFilter);
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

  // Block background scroll when modal is open
  useEffect(() => {
    if (showActionItemModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showActionItemModal]);

  // Reset editing item when modal closes
  useEffect(() => {
    if (!showActionItemModal) {
      setEditingItem(null);
    }
  }, [showActionItemModal]);

  const handleAreaClick = (area: LifeArea) => {
    onNavigate("detail", { areaId: area.id });
  };

  const handleScoreClick = async (areaId: number, score: number) => {
    try {
      await invoke("create_score", { areaId, value: score });
      await refreshScores();
      toast.success(`Score updated to ${score}/10`, {
        id: `score-update-${areaId}-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update score";
      toast.error(message, {
        id: `score-error-${areaId}-${Date.now()}`,
      });
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      await invoke("update_action_item_status", { id: itemId, status: newStatus });
      await refreshActionItems();
      toast.success("Status updated successfully", {
        id: `status-update-${itemId}-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message, {
        id: `status-error-${itemId}-${Date.now()}`,
      });
    }
  };

  const handleCreateActionItem = async (
    areaId: number,
    title: string,
    description: string | undefined,
    priority: string | undefined,
    deadline: number | undefined
  ) => {
    try {
      await invoke("create_action_item", {
        areaId,
        title,
        description: description || null,
        priority: priority || null,
        deadline: deadline || null,
      });
      await refreshActionItems();
      setShowActionItemModal(false);
      toast.success("Action item created successfully", {
        id: `create-item-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create action item";
      toast.error(message, {
        id: `create-item-error-${Date.now()}`,
      });
    }
  };

  const handleUpdateActionItem = async (
    _areaId: number,
    title: string,
    description: string | undefined,
    priority: string | undefined,
    deadline: number | undefined
  ) => {
    if (!editingItem) return;
    
    try {
      await invoke("update_action_item", {
        id: editingItem.id,
        title,
        description: description || null,
        status: editingItem.status,
        priority: priority || null,
        deadline: deadline || null,
      });
      await refreshActionItems();
      setShowActionItemModal(false);
      setEditingItem(null);
      toast.success("Action item updated successfully", {
        id: `update-item-${Date.now()}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update action item";
      toast.error(message, {
        id: `update-item-error-${Date.now()}`,
      });
    }
  };

  const handleEditClick = (item: ActionItem) => {
    setEditingItem(item);
    setShowActionItemModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Roda da Vida!
          </h2>
          <p className="text-gray-600 mb-6">
            Get started by creating your first life area. This will help you track
            different aspects of your life and visualize your progress.
          </p>
          <button
            onClick={() => onNavigate("manage")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Your First Area
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Life Wheel</h1>
          <p className="text-gray-600 mt-1">
            Click on any cell in the wheel to update scores, or click an area name to view details
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("history")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => onNavigate("manage")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Areas
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        {/* Left Column: Life Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
          <LifeWheel
            areas={areas}
            scores={scores}
            onAreaClick={handleAreaClick}
            onScoreClick={handleScoreClick}
            size={500}
          />
          <p className="text-sm text-gray-600 mt-10 text-center">
            Click anywhere on the wheel to update scores. Click area names to view details.
          </p>
        </div>

        {/* Right Column: Action Items */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowActionItemModal(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                New Action
              </button>
              <select
                value={areaFilter || ""}
                onChange={(e) => setAreaFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="custom-select px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {actionItemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : actionItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <p>No action items found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {actionItems.map((item) => {
                const area = areas.find((a) => a.id === item.area_id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: area?.color || "#gray" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {area?.name || "Unknown Area"}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{item.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit action item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="custom-select-xs px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Item Modal */}
      {showActionItemModal && (
        <div 
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowActionItemModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <ActionItemForm
                item={editingItem || undefined}
                areaId={editingItem?.area_id}
                areas={areas}
                showAreaSelector={!editingItem}
                showHeader={true}
                showCardWrapper={false}
                onSubmit={editingItem ? handleUpdateActionItem : handleCreateActionItem}
                onCancel={() => {
                  setShowActionItemModal(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

