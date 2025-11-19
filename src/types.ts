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
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  deadline?: number;
  created_at: number;
  completed_at?: number;
}

