mod database;
mod models;

use database::{init_database, get_connection};
use models::{LifeArea, Score, ActionItem};
use rusqlite::params;
use chrono::Utc;

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
    let mut stmt = conn.prepare(
        "SELECT id FROM life_areas WHERE name = ? AND is_active = 1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    if stmt.exists(params![name]).map_err(|e| format!("Failed to check name: {}", e))? {
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
    
    let areas = stmt.query_map([], |row| {
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
    }).map_err(|e| format!("Failed to query life areas: {}", e))?;
    
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
    let mut stmt = conn.prepare(
        "SELECT id FROM life_areas WHERE name = ? AND is_active = 1 AND id != ?"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    if stmt.exists(params![name, id]).map_err(|e| format!("Failed to check name: {}", e))? {
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
    ).map_err(|e| format!("Failed to delete life area: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn restore_life_area(id: i64) -> Result<LifeArea, String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();
    
    // Check if name conflicts with active area
    let area = get_life_area(id)?;
    let mut stmt = conn.prepare(
        "SELECT id FROM life_areas WHERE name = ? AND is_active = 1 AND id != ?"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    if stmt.exists(params![area.name, id]).map_err(|e| format!("Failed to check name: {}", e))? {
        return Err("An active area with this name already exists".to_string());
    }
    
    conn.execute(
        "UPDATE life_areas SET is_active = 1, updated_at = ? WHERE id = ?",
        params![now, id],
    ).map_err(|e| format!("Failed to restore life area: {}", e))?;
    
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
    ).map_err(|e| format!("Failed to insert score: {}", e))?;
    
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
    
    let scores = stmt.query_map(params![area_id], |row| {
        Ok(Score {
            id: row.get(0)?,
            area_id: row.get(1)?,
            value: row.get(2)?,
            recorded_at: row.get(3)?,
        })
    }).map_err(|e| format!("Failed to query scores: {}", e))?;
    
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
    
    let mut scores = stmt.query_map(params![area_id], |row| {
        Ok(Score {
            id: row.get(0)?,
            area_id: row.get(1)?,
            value: row.get(2)?,
            recorded_at: row.get(3)?,
        })
    }).map_err(|e| format!("Failed to query score: {}", e))?;
    
    Ok(scores.next().transpose().map_err(|e| format!("Failed to parse score: {}", e))?)
}

#[tauri::command]
fn get_all_latest_scores() -> Result<Vec<Score>, String> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.area_id, s.value, s.recorded_at
         FROM scores s
         INNER JOIN (
             SELECT area_id, MAX(recorded_at) as max_recorded_at
             FROM scores
             GROUP BY area_id
         ) latest ON s.area_id = latest.area_id AND s.recorded_at = latest.max_recorded_at
         INNER JOIN life_areas la ON s.area_id = la.id
         WHERE la.is_active = 1
         ORDER BY la.\"order\""
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let scores = stmt.query_map([], |row| {
        Ok(Score {
            id: row.get(0)?,
            area_id: row.get(1)?,
            value: row.get(2)?,
            recorded_at: row.get(3)?,
        })
    }).map_err(|e| format!("Failed to query scores: {}", e))?;
    
    let mut result = Vec::new();
    for score in scores {
        result.push(score.map_err(|e| format!("Failed to parse score: {}", e))?);
    }
    
    Ok(result)
}

#[tauri::command]
fn create_action_item(
    area_id: i64,
    title: String,
    description: Option<String>,
    priority: Option<String>,
    deadline: Option<i64>,
) -> Result<ActionItem, String> {
    let conn = get_connection()?;
    let now = Utc::now().timestamp();
    
    if let Some(ref p) = priority {
        if !["low", "medium", "high"].contains(&p.as_str()) {
            return Err("Priority must be 'low', 'medium', or 'high'".to_string());
        }
    }
    
    conn.execute(
        "INSERT INTO action_items (area_id, title, description, status, priority, deadline, created_at)
         VALUES (?1, ?2, ?3, 'todo', ?4, ?5, ?6)",
        params![area_id, title, description, priority, deadline, now],
    ).map_err(|e| format!("Failed to insert action item: {}", e))?;
    
    let id = conn.last_insert_rowid();
    
    Ok(ActionItem {
        id,
        area_id,
        title,
        description,
        status: "todo".to_string(),
        priority,
        deadline,
        created_at: now,
        completed_at: None,
    })
}

#[tauri::command]
fn get_action_items_by_area(
    area_id: i64,
    status_filter: Option<String>,
) -> Result<Vec<ActionItem>, String> {
    let conn = get_connection()?;
    
    let mut result = Vec::new();
    
    if let Some(status) = status_filter {
        let mut stmt = conn.prepare(
            "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at
             FROM action_items
             WHERE area_id = ? AND status = ?
             ORDER BY created_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let rows = stmt.query_map(params![area_id, status], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query action items: {}", e))?;
        
        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at
             FROM action_items
             WHERE area_id = ?
             ORDER BY created_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let rows = stmt.query_map(params![area_id], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query action items: {}", e))?;
        
        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    }
    
    Ok(result)
}

#[tauri::command]
fn get_all_action_items(
    area_filter: Option<i64>,
) -> Result<Vec<ActionItem>, String> {
    let conn = get_connection()?;
    
    let mut result = Vec::new();
    
    if let Some(area_id) = area_filter {
        let mut stmt = conn.prepare(
            "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at
             FROM action_items
             WHERE status != 'done' AND area_id = ?
             ORDER BY created_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let rows = stmt.query_map(params![area_id], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query action items: {}", e))?;
        
        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at
             FROM action_items
             WHERE status != 'done'
             ORDER BY created_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let rows = stmt.query_map(params![], |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query action items: {}", e))?;
        
        for item in rows {
            result.push(item.map_err(|e| format!("Failed to parse action item: {}", e))?);
        }
    }
    
    Ok(result)
}

#[tauri::command]
fn update_action_item(
    id: i64,
    title: String,
    description: Option<String>,
    status: String,
    priority: Option<String>,
    deadline: Option<i64>,
) -> Result<ActionItem, String> {
    if !["todo", "in_progress", "done"].contains(&status.as_str()) {
        return Err("Status must be 'todo', 'in_progress', or 'done'".to_string());
    }
    
    if let Some(ref p) = priority {
        if !["low", "medium", "high"].contains(&p.as_str()) {
            return Err("Priority must be 'low', 'medium', or 'high'".to_string());
        }
    }
    
    let conn = get_connection()?;
    let now = Utc::now().timestamp();
    
    // Set completed_at if status is 'done' and wasn't before
    let mut completed_at: Option<i64> = None;
    if status == "done" {
        let current: Option<String> = conn.query_row(
            "SELECT status FROM action_items WHERE id = ?",
            params![id],
            |row| Ok(row.get(0)?),
        ).ok();
        
        if current.as_deref() != Some("done") {
            completed_at = Some(now);
        } else {
            // Keep existing completed_at
            completed_at = conn.query_row(
                "SELECT completed_at FROM action_items WHERE id = ?",
                params![id],
                |row| Ok(row.get(0)?),
            ).ok().flatten();
        }
    }
    
    conn.execute(
        "UPDATE action_items SET title = ?1, description = ?2, status = ?3, priority = ?4, deadline = ?5, completed_at = ?6 WHERE id = ?7",
        params![title, description, status, priority, deadline, completed_at, id],
    ).map_err(|e| format!("Failed to update action item: {}", e))?;
    
    conn.query_row(
        "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at FROM action_items WHERE id = ?",
        params![id],
        |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        },
    ).map_err(|e| format!("Failed to get action item: {}", e))
}

#[tauri::command]
fn delete_action_item(id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM action_items WHERE id = ?",
        params![id],
    ).map_err(|e| format!("Failed to delete action item: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn update_action_item_status(id: i64, status: String) -> Result<ActionItem, String> {
    if !["todo", "in_progress", "done"].contains(&status.as_str()) {
        return Err("Status must be 'todo', 'in_progress', or 'done'".to_string());
    }
    
    let conn = get_connection()?;
    let now = Utc::now().timestamp();
    
    // Get current item to preserve other fields
    let current: ActionItem = conn.query_row(
        "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at FROM action_items WHERE id = ?",
        params![id],
        |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        },
    ).map_err(|e| format!("Failed to get action item: {}", e))?;
    
    let mut completed_at = current.completed_at;
    if status == "done" && current.status != "done" {
        completed_at = Some(now);
    } else if status != "done" {
        completed_at = None;
    }
    
    conn.execute(
        "UPDATE action_items SET status = ?1, completed_at = ?2 WHERE id = ?3",
        params![status, completed_at, id],
    ).map_err(|e| format!("Failed to update action item status: {}", e))?;
    
    // Return updated item
    conn.query_row(
        "SELECT id, area_id, title, description, status, priority, deadline, created_at, completed_at FROM action_items WHERE id = ?",
        params![id],
        |row| {
            Ok(ActionItem {
                id: row.get(0)?,
                area_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                deadline: row.get(6)?,
                created_at: row.get(7)?,
                completed_at: row.get(8)?,
            })
        },
    ).map_err(|e| format!("Failed to get updated action item: {}", e))
}

#[tauri::command]
fn reset_area_data(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    
    // Delete all scores for this area
    conn.execute(
        "DELETE FROM scores WHERE area_id = ?",
        params![area_id],
    ).map_err(|e| format!("Failed to delete scores: {}", e))?;
    
    // Delete all action items for this area
    conn.execute(
        "DELETE FROM action_items WHERE area_id = ?",
        params![area_id],
    ).map_err(|e| format!("Failed to delete action items: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn reset_area_scores(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM scores WHERE area_id = ?",
        params![area_id],
    ).map_err(|e| format!("Failed to delete scores: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn reset_area_action_items(area_id: i64) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM action_items WHERE area_id = ?",
        params![area_id],
    ).map_err(|e| format!("Failed to delete action items: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn reset_all_data() -> Result<(), String> {
    let conn = get_connection()?;
    
    // Delete all scores
    conn.execute(
        "DELETE FROM scores",
        [],
    ).map_err(|e| format!("Failed to delete scores: {}", e))?;
    
    // Delete all action items
    conn.execute(
        "DELETE FROM action_items",
        [],
    ).map_err(|e| format!("Failed to delete action items: {}", e))?;
    
    // Delete all life areas
    conn.execute(
        "DELETE FROM life_areas",
        [],
    ).map_err(|e| format!("Failed to delete life areas: {}", e))?;
    
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
            delete_action_item,
            update_action_item_status,
            reset_area_data,
            reset_area_scores,
            reset_area_action_items,
            reset_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

