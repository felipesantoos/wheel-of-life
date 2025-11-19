use rusqlite::Connection;
use std::path::PathBuf;

pub fn get_db_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir()
        .ok_or("Failed to get home directory")?;
    Ok(home.join(".roda-da-vida").join("data.db"))
}

pub fn init_database() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    
    // Create directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS life_areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT NOT NULL,
            \"order\" INTEGER NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(name, is_active) ON CONFLICT IGNORE
        )",
        [],
    ).map_err(|e| format!("Failed to create life_areas table: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL,
            value INTEGER NOT NULL CHECK(value >= 0 AND value <= 10),
            recorded_at INTEGER NOT NULL,
            FOREIGN KEY(area_id) REFERENCES life_areas(id)
        )",
        [],
    ).map_err(|e| format!("Failed to create scores table: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            archived_at INTEGER,
            FOREIGN KEY(area_id) REFERENCES life_areas(id)
        )",
        [],
    ).map_err(|e| format!("Failed to create action_items table: {}", e))?;
    
    migrate_action_items_table(&conn)?;
    
    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_scores_area_id ON scores(area_id)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_scores_recorded_at ON scores(recorded_at)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_action_items_area_id ON action_items(area_id)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_action_items_archived ON action_items(archived_at)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;
    
    Ok(conn)
}

pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))
}

fn migrate_action_items_table(conn: &Connection) -> Result<(), String> {
    let mut stmt = conn.prepare("PRAGMA table_info(action_items)")
        .map_err(|e| format!("Failed to inspect action_items table: {}", e))?;
    
    let column_info = stmt.query_map([], |row| {
        Ok(row.get::<usize, String>(1)?)
    }).map_err(|e| format!("Failed to iterate table info: {}", e))?;
    
    let mut has_archived_column = false;
    for col in column_info {
        let name = col.map_err(|e| format!("Failed to read column info: {}", e))?;
        if name == "archived_at" {
            has_archived_column = true;
            break;
        }
    }
    
    if !has_archived_column {
        conn.execute("ALTER TABLE action_items RENAME TO action_items_old", [])
            .map_err(|e| format!("Failed to rename action_items table: {}", e))?;
        
        conn.execute(
            "CREATE TABLE action_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                area_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                archived_at INTEGER,
                FOREIGN KEY(area_id) REFERENCES life_areas(id)
            )",
            [],
        ).map_err(|e| format!("Failed to recreate action_items table: {}", e))?;
        
        conn.execute(
            "INSERT INTO action_items (id, area_id, title, created_at)
             SELECT id, area_id, title, created_at FROM action_items_old",
            [],
        ).map_err(|e| format!("Failed to migrate action_items data: {}", e))?;
        
        conn.execute("DROP TABLE action_items_old", [])
            .map_err(|e| format!("Failed to drop old action_items table: {}", e))?;
    }
    
    Ok(())
}

