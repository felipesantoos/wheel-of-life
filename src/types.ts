export interface LifeArea {
  id: number;
  name: string;
  description?: string;
  color: string;
  order: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface Score {
  id: number;
  area_id: number;
  value: number; // 0-10
  recorded_at: number;
}

export interface ActionItem {
  id: number;
  area_id: number;
  title: string;
  created_at: number;
  position: number;
  archived_at?: number;
}

export type Page = "home" | "detail" | "manage" | "history";

