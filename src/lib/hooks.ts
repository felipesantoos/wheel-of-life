import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import type { LifeArea, Score, ActionItem } from "../types";

export function useLifeAreas(includeArchived = false) {
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<LifeArea[]>("get_life_areas", { includeArchived });
      setAreas(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load life areas";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const createArea = async (
    name: string,
    description: string | undefined,
    color: string,
    order: number
  ) => {
    try {
      const newArea = await invoke<LifeArea>("create_life_area", {
        name,
        description: description || null,
        color,
        order,
      });
      await loadAreas();
      toast.success("Life area created successfully");
      return newArea;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create life area";
      toast.error(message);
      throw err;
    }
  };

  const updateArea = async (
    id: number,
    name: string,
    description: string | undefined,
    color: string,
    order: number
  ) => {
    try {
      const updated = await invoke<LifeArea>("update_life_area", {
        id,
        name,
        description: description || null,
        color,
        order,
      });
      await loadAreas();
      toast.success("Life area updated successfully");
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update life area";
      toast.error(message);
      throw err;
    }
  };

  const deleteArea = async (id: number) => {
    try {
      await invoke("soft_delete_life_area", { id });
      await loadAreas();
      toast.success("Life area archived");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete life area";
      toast.error(message);
      throw err;
    }
  };

  const restoreArea = async (id: number) => {
    try {
      await invoke<LifeArea>("restore_life_area", { id });
      await loadAreas();
      toast.success("Life area restored");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to restore life area";
      toast.error(message);
      throw err;
    }
  };

  return {
    areas,
    loading,
    error,
    createArea,
    updateArea,
    deleteArea,
    restoreArea,
    refresh: loadAreas,
  };
}

export function useScores(areaId?: number) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestScore, setLatestScore] = useState<Score | null>(null);

  const loadScores = useCallback(async () => {
    if (!areaId) {
      setScores([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [allScores, latest] = await Promise.all([
        invoke<Score[]>("get_scores_by_area", { areaId }),
        invoke<Score | null>("get_latest_score", { areaId }),
      ]);
      setScores(allScores);
      setLatestScore(latest);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load scores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const createScore = async (areaId: number, value: number) => {
    try {
      await invoke<Score>("create_score", { areaId, value });
      await loadScores();
      toast.success("Score recorded successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create score";
      toast.error(message);
      throw err;
    }
  };

  return {
    scores,
    latestScore,
    loading,
    createScore,
    refresh: loadScores,
  };
}

export function useAllLatestScores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScores = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<Score[]>("get_all_latest_scores");
      setScores(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load scores";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  return {
    scores,
    loading,
    refresh: loadScores,
  };
}

export function useActionItems(areaId?: number) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!areaId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await invoke<ActionItem[]>("get_action_items_by_area", {
        areaId,
      });
      setItems(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load action items";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = async (areaId: number, title: string) => {
    try {
      await invoke<ActionItem>("create_action_item", {
        areaId,
        title,
      });
      await loadItems();
      toast.success("Action item created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create action item";
      toast.error(message);
      throw err;
    }
  };

  const updateItem = async (id: number, title: string) => {
    try {
      await invoke<ActionItem>("update_action_item", {
        id,
        title,
      });
      await loadItems();
      toast.success("Action item updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update action item";
      toast.error(message);
      throw err;
    }
  };

  const archiveItem = async (id: number) => {
    try {
      await invoke("archive_action_item", { id });
      await loadItems();
      toast.success("Action item archived");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to archive action item";
      toast.error(message);
      throw err;
    }
  };

  return {
    items,
    loading,
    createItem,
    updateItem,
    archiveItem,
    refresh: loadItems,
  };
}

export function useAllActionItems(areaFilter?: number) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<ActionItem[]>("get_all_action_items", {
        areaFilter: areaFilter || null,
      });
      setItems(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load action items";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [areaFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return { items, loading, refresh: loadItems };
}

export function useResetAreaData() {
  const resetAreaData = async (areaId: number) => {
    try {
      await invoke("reset_area_data", { areaId });
      toast.success("Area data reset successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset area data";
      toast.error(message);
      throw err;
    }
  };

  return { resetAreaData };
}

export function useResetAreaScores() {
  const resetAreaScores = async (areaId: number) => {
    try {
      await invoke("reset_area_scores", { areaId });
      toast.success("Score history reset successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset score history";
      toast.error(message);
      throw err;
    }
  };

  return { resetAreaScores };
}

export function useResetAreaActionItems() {
  const resetAreaActionItems = async (areaId: number) => {
    try {
      await invoke("reset_area_action_items", { areaId });
      toast.success("Action items reset successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset action items";
      toast.error(message);
      throw err;
    }
  };

  return { resetAreaActionItems };
}

export function useResetAllData() {
  const resetAllData = async () => {
    try {
      await invoke("reset_all_data");
      toast.success("Database reset successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset database";
      toast.error(message);
      throw err;
    }
  };

  return { resetAllData };
}

