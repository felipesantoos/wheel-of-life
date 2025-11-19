mod database;
mod models;

use chrono::Utc;
use database::{get_connection, init_database};
use models::{ActionItem, LifeArea, Score};
use rusqlite::params;
use serde::Deserialize;

#[tauri::command]
fn create_life_area(
    name: String,
    description: Option<String>,
    color: String,
    order: i64,
) -> Result<LifeArea, String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    // Check if name already exists for active areas
    let mut stmt = conn
        .prepare("SELECT id FROM life_areas WHERE name = ? AND is_active = 1")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    if stmt
        .exists(params![name])
        .map_err(|e| format!("Failed to check name: {}", e))?
    {
        return Err("An active area with this name already exists".to_string());
    }

    conn.execute(
        "INSERT INTO life_areas (name, description, color, \"order\", is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 1, ?5, ?5)",
        params![name, description, color, order, now],
    ).map_err(|e| format!("Failed to insert life area: {}", e))?;

    let id = conn.last_insert_rowid();

    // Get the created area
    conn.query_row(
        "SELECT id, name, description, color, \"order\", is_active, created_at, updated_at FROM life_areas WHERE id = ?",
        params![id],
        |row| {
            Ok(LifeArea {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                order: row.get(4)?,
                is_active: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    ).map_err(|e| format!("Failed to get created life area: {}", e))
}

#[tauri::command]
fn get_life_areas(include_archived: bool) -> Result<Vec<LifeArea>, String> {
    let conn = get_connection()?;
    let mut stmt = if include_archived {
        conn.prepare("SELECT id, name, description, color, \"order\", is_active, created_at, updated_at FROM life_areas ORDER BY \"order\", name")
    } else {
        conn.prepare("SELECT id, name, description, color, \"order\", is_active, created_at, updated_at FROM life_areas WHERE is_active = 1 ORDER BY \"order\", name")
    }.map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let areas = stmt
        .query_map([], |row| {
            Ok(LifeArea {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                order: row.get(4)?,
                is_active: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to query life areas: {}", e))?;

    let mut result = Vec::new();
    for area in areas {
        result.push(area.map_err(|e| format!("Failed to parse area: {}", e))?);
    }

    Ok(result)
}

#[tauri::command]
fn get_life_area(id: i64) -> Result<LifeArea, String> {
    let conn = get_connection()?;

    conn.query_row(
        "SELECT id, name, description, color, \"order\", is_active, created_at, updated_at FROM life_areas WHERE id = ?",
        params![id],
        |row| {
            Ok(LifeArea {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                color: row.get(3)?,
                order: row.get(4)?,
                is_active: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    ).map_err(|e| format!("Failed to get life area: {}", e))
}

#[tauri::command]
fn update_life_area(
    id: i64,
    name: String,
    description: Option<String>,
    color: String,
    order: i64,
) -> Result<LifeArea, String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    // Check if name already exists for active areas (excluding current)
    let mut stmt = conn
        .prepare("SELECT id FROM life_areas WHERE name = ? AND is_active = 1 AND id != ?")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    if stmt
        .exists(params![name, id])
        .map_err(|e| format!("Failed to check name: {}", e))?
    {
        return Err("An active area with this name already exists".to_string());
    }

    conn.execute(
        "UPDATE life_areas SET name = ?1, description = ?2, color = ?3, \"order\" = ?4, updated_at = ?5 WHERE id = ?6",
        params![name, description, color, order, now, id],
    ).map_err(|e| format!("Failed to update life area: {}", e))?;

    get_life_area(id)
}

#[tauri::command]
fn soft_delete_life_area(id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    conn.execute(
        "UPDATE life_areas SET is_active = 0, updated_at = ? WHERE id = ?",
        params![now, id],
    )
    .map_err(|e| format!("Failed to delete life area: {}", e))?;

    Ok(())
}

#[tauri::command]
fn restore_life_area(id: i64) -> Result<LifeArea, String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    // Check if name conflicts with active area
    let area = get_life_area(id)?;
    let mut stmt = conn
        .prepare("SELECT id FROM life_areas WHERE name = ? AND is_active = 1 AND id != ?")
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    if stmt
        .exists(params![area.name, id])
        .map_err(|e| format!("Failed to check name: {}", e))?
    {
        return Err("An active area with this name already exists".to_string());
    }

    conn.execute(
        "UPDATE life_areas SET is_active = 1, updated_at = ? WHERE id = ?",
        params![now, id],
    )
    .map_err(|e| format!("Failed to restore life area: {}", e))?;

    get_life_area(id)
}

#[tauri::command]
fn create_score(area_id: i64, value: i64) -> Result<Score, String> {
    if value < 0 || value > 10 {
        return Err("Score must be between 0 and 10".to_string());
    }

    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO scores (area_id, value, recorded_at) VALUES (?1, ?2, ?3)",
        params![area_id, value, now],
    )
    .map_err(|e| format!("Failed to insert score: {}", e))?;

    let id = conn.last_insert_rowid();

    Ok(Score {
        id,
        area_id,
        value,
        recorded_at: now,
    })
}

#[tauri::command]
fn get_scores_by_area(area_id: i64) -> Result<Vec<Score>, String> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT id, area_id, value, recorded_at FROM scores WHERE area_id = ? ORDER BY recorded_at DESC"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let scores = stmt
        .query_map(params![area_id], |row| {
            Ok(Score {
                id: row.get(0)?,
                area_id: row.get(1)?,
                value: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("Failed to query scores: {}", e))?;

    let mut result = Vec::new();
    for score in scores {
        result.push(score.map_err(|e| format!("Failed to parse score: {}", e))?);
    }

    Ok(result)
}

#[tauri::command]
fn get_latest_score(area_id: i64) -> Result<Option<Score>, String> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, area_id, value, recorded_at FROM scores WHERE area_id = ? ORDER BY recorded_at DESC LIMIT 1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let mut scores = stmt
        .query_map(params![area_id], |row| {
            Ok(Score {
                id: row.get(0)?,
                area_id: row.get(1)?,
                value: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("Failed to query score: {}", e))?;

    Ok(scores
        .next()
        .transpose()
        .map_err(|e| format!("Failed to parse score: {}", e))?)
}

#[tauri::command]
fn get_all_latest_scores() -> Result<Vec<Score>, String> {
    let conn = get_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT s.id, s.area_id, s.value, s.recorded_at
         FROM scores s
         INNER JOIN (
             SELECT area_id, MAX(recorded_at) as max_recorded_at
             FROM scores
             GROUP BY area_id
         ) latest ON s.area_id = latest.area_id AND s.recorded_at = latest.max_recorded_at
         INNER JOIN life_areas la ON s.area_id = la.id
         WHERE la.is_active = 1
         ORDER BY la.\"order\"",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let scores = stmt
        .query_map([], |row| {
            Ok(Score {
                id: row.get(0)?,
                area_id: row.get(1)?,
                value: row.get(2)?,
                recorded_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("Failed to query scores: {}", e))?;

    let mut result = Vec::new();
    for score in scores {
        result.push(score.map_err(|e| format!("Failed to parse score: {}", e))?);
    }

    Ok(result)
}

#[tauri::command]
fn create_action_item(area_id: i64, title: String) -> Result<ActionItem, String> {
    let clean_title = title.trim();
    if clean_title.is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let conn = get_connection()?;
    let now = Utc::now().timestamp();
    let next_position: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM action_items",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO action_items (area_id, title, created_at, position)
         VALUES (?1, ?2, ?3, ?4)",
        params![area_id, clean_title, now, next_position],
    )
    .map_err(|e| format!("Failed to insert action item: {}", e))?;

    let id = conn.last_insert_rowid();

    Ok(ActionItem {
        id,
        area_id,
        title: clean_title.to_string(),
        created_at: now,
        position: next_position,
        archived_at: None,
    })
}

#[tauri::command]
fn get_action_items_by_area(area_id: i64) -> Result<Vec<ActionItem>, String> {
    let conn = get_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, area_id, title, created_at, position, archived_at
         FROM action_items
         WHERE area_id = ? AND archived_at IS NULL
         ORDER BY position ASC, created_at ASC",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let rows = stmt
        .query_map(params![area_id], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                position: row.get(4)?,
                archived_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("Failed to query action items: {}", e))?;

    let mut result = Vec::new();
    for item in rows {
        result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
    }

    Ok(result)
}

#[tauri::command]
fn get_all_action_items(area_filter: Option<i64>) -> Result<Vec<ActionItem>, String> {
    let conn = get_connection()?;

    let base_query = "SELECT id, area_id, title, created_at, position, archived_at
                      FROM action_items
                      WHERE archived_at IS NULL";

    let mut result = Vec::new();

    if let Some(area_id) = area_filter {
        let mut stmt = conn
            .prepare(&format!(
                "{base_query} AND area_id = ? ORDER BY position ASC, created_at ASC"
            ))
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map(params![area_id], |row| {
                Ok(ActionItem {
                    id: row.get(0)?,
                    area_id: row.get(1)?,
                    title: row.get(2)?,
                    created_at: row.get(3)?,
                    position: row.get(4)?,
                    archived_at: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query action items: {}", e))?;

        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    } else {
        let mut stmt = conn
            .prepare(&format!(
                "{base_query} ORDER BY position ASC, created_at ASC"
            ))
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(ActionItem {
                    id: row.get(0)?,
                    area_id: row.get(1)?,
                    title: row.get(2)?,
                    created_at: row.get(3)?,
                    position: row.get(4)?,
                    archived_at: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query action items: {}", e))?;

        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    }

    Ok(result)
}

#[tauri::command]
fn update_action_item(id: i64, title: String) -> Result<ActionItem, String> {
    let clean_title = title.trim();
    if clean_title.is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let conn = get_connection()?;

    conn.execute(
        "UPDATE action_items SET title = ?1 WHERE id = ?2",
        params![clean_title, id],
    )
    .map_err(|e| format!("Failed to update action item: {}", e))?;

    conn.query_row(
        "SELECT id, area_id, title, created_at, position, archived_at FROM action_items WHERE id = ?",
        params![id],
        |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                position: row.get(4)?,
                archived_at: row.get(5)?,
            })
        },
    ).map_err(|e| format!("Failed to get action item: {}", e))
}

#[tauri::command]
fn archive_action_item(id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();

    conn.execute(
        "UPDATE action_items SET archived_at = ?1 WHERE id = ?2",
        params![now, id],
    )
    .map_err(|e| format!("Failed to archive action item: {}", e))?;

    Ok(())
}

#[tauri::command]
fn delete_action_item(id: i64) -> Result<(), String> {
    let conn = get_connection()?;

    conn.execute("DELETE FROM action_items WHERE id = ?", params![id])
        .map_err(|e| format!("Failed to delete action item: {}", e))?;

    Ok(())
}

#[derive(Debug, Deserialize)]
struct ReorderUpdate {
    id: i64,
    position: i64,
}

#[tauri::command]
fn reorder_action_items(updates: Vec<ReorderUpdate>) -> Result<(), String> {
    if updates.is_empty() {
        return Ok(());
    }

    let mut conn = get_connection()?;
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    for update in updates {
        tx.execute(
            "UPDATE action_items SET position = ?1 WHERE id = ?2",
            params![update.position, update.id],
        )
        .map_err(|e| format!("Failed to update action item position: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;
    Ok(())
}

#[tauri::command]
fn reset_area_data(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;

    // Delete all scores for this area
    conn.execute("DELETE FROM scores WHERE area_id = ?", params![area_id])
        .map_err(|e| format!("Failed to delete scores: {}", e))?;

    // Delete all action items for this area
    conn.execute(
        "DELETE FROM action_items WHERE area_id = ?",
        params![area_id],
    )
    .map_err(|e| format!("Failed to delete action items: {}", e))?;

    Ok(())
}

#[tauri::command]
fn reset_area_scores(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;

    conn.execute("DELETE FROM scores WHERE area_id = ?", params![area_id])
        .map_err(|e| format!("Failed to delete scores: {}", e))?;

    Ok(())
}

#[tauri::command]
fn reset_area_action_items(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;

    conn.execute(
        "DELETE FROM action_items WHERE area_id = ?",
        params![area_id],
    )
    .map_err(|e| format!("Failed to delete action items: {}", e))?;

    Ok(())
}

#[tauri::command]
fn reset_all_data() -> Result<(), String> {
    let conn = get_connection()?;

    // Delete all scores
    conn.execute("DELETE FROM scores", [])
        .map_err(|e| format!("Failed to delete scores: {}", e))?;

    // Delete all action items
    conn.execute("DELETE FROM action_items", [])
        .map_err(|e| format!("Failed to delete action items: {}", e))?;

    // Delete all life areas
    conn.execute("DELETE FROM life_areas", [])
        .map_err(|e| format!("Failed to delete life areas: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database on startup
    if let Err(e) = init_database() {
        eprintln!("Failed to initialize database: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_life_area,
            get_life_areas,
            get_life_area,
            update_life_area,
            soft_delete_life_area,
            restore_life_area,
            create_score,
            get_scores_by_area,
            get_latest_score,
            get_all_latest_scores,
            create_action_item,
            get_action_items_by_area,
            get_all_action_items,
            update_action_item,
            reorder_action_items,
            archive_action_item,
            delete_action_item,
            reset_area_data,
            reset_area_scores,
            reset_area_action_items,
            reset_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
