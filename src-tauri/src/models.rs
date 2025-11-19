use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LifeArea {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub order: i64,
    pub is_active: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Score {
    pub id: i64,
    pub area_id: i64,
    pub value: i64,
    pub recorded_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActionItem {
    pub id: i64,
    pub area_id: i64,
    pub title: String,
    pub created_at: i64,
    pub position: i64,
    pub archived_at: Option<i64>,
}
