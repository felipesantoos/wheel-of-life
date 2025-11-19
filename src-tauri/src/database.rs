use rusqlite::{params, Connection};
use std::path::PathBuf;

pub fn get_db_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Failed to get home directory")?;
    Ok(home.join(".roda-da-vida").join("data.db"))
}

pub fn init_database() -> Result<Connection, String> {
    let db_path = get_db_path()?;

    // Create directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))?;

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
    )
    .map_err(|e| format!("Failed to create life_areas table: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL,
            value INTEGER NOT NULL CHECK(value >= 0 AND value <= 10),
            recorded_at INTEGER NOT NULL,
            FOREIGN KEY(area_id) REFERENCES life_areas(id)
        )",
        [],
    )
    .map_err(|e| format!("Failed to create scores table: {}", e))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            position INTEGER NOT NULL,
            archived_at INTEGER,
            FOREIGN KEY(area_id) REFERENCES life_areas(id)
        )",
        [],
    )
    .map_err(|e| format!("Failed to create action_items table: {}", e))?;

    migrate_action_items_table(&conn)?;

    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_scores_area_id ON scores(area_id)",
        [],
    )
    .map_err(|e| format!("Failed to create index: {}", e))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_scores_recorded_at ON scores(recorded_at)",
        [],
    )
    .map_err(|e| format!("Failed to create index: {}", e))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_action_items_area_id ON action_items(area_id)",
        [],
    )
    .map_err(|e| format!("Failed to create index: {}", e))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_action_items_position ON action_items(position)",
        [],
    )
    .map_err(|e| format!("Failed to create index: {}", e))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_action_items_archived ON action_items(archived_at)",
        [],
    )
    .map_err(|e| format!("Failed to create index: {}", e))?;

    Ok(conn)
}

pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    Connection::open(&db_path).map_err(|e| format!("Failed to open database: {}", e))
}

fn migrate_action_items_table(conn: &Connection) -> Result<(), String> {
    let mut stmt = conn
        .prepare("PRAGMA table_info(action_items)")
        .map_err(|e| format!("Failed to inspect action_items table: {}", e))?;

    let mut column_names = Vec::new();
    let info_rows = stmt
        .query_map([], |row| Ok(row.get::<usize, String>(1)?))
        .map_err(|e| format!("Failed to iterate table info: {}", e))?;
    for col in info_rows {
        column_names.push(col.map_err(|e| format!("Failed to read column info: {}", e))?);
    }

    let has_archived_column = column_names.iter().any(|c| c == "archived_at");
    let has_position_column = column_names.iter().any(|c| c == "position");

    if has_archived_column && has_position_column {
        return Ok(());
    }

    conn.execute("ALTER TABLE action_items RENAME TO action_items_old", [])
        .map_err(|e| format!("Failed to rename action_items table: {}", e))?;

    conn.execute(
        "CREATE TABLE action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            position INTEGER NOT NULL,
            archived_at INTEGER,
            FOREIGN KEY(area_id) REFERENCES life_areas(id)
        )",
        [],
    )
    .map_err(|e| format!("Failed to recreate action_items table: {}", e))?;

    let select_sql = match (has_position_column, has_archived_column) {
        (true, true) => {
            "SELECT id, area_id, title, created_at, position, archived_at FROM action_items_old ORDER BY position, created_at"
        }
        (true, false) => {
            "SELECT id, area_id, title, created_at, position, NULL as archived_at FROM action_items_old ORDER BY position, created_at"
        }
        (false, true) => {
            "SELECT id, area_id, title, created_at, NULL as position, archived_at FROM action_items_old ORDER BY created_at"
        }
        (false, false) => {
            "SELECT id, area_id, title, created_at, NULL as position, NULL as archived_at FROM action_items_old ORDER BY created_at"
        }
    };

    let mut select_stmt = conn
        .prepare(select_sql)
        .map_err(|e| format!("Failed to prepare migration select: {}", e))?;
    let select_rows = select_stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, Option<i64>>(4)?,
                row.get::<_, Option<i64>>(5)?,
            ))
        })
        .map_err(|e| format!("Failed to query migration data: {}", e))?;

    let mut next_position: i64 = 0;
    for row in select_rows {
        let (id, area_id, title, created_at, position_opt, archived_at) =
            row.map_err(|e| format!("Failed to parse migration row: {}", e))?;
        let position = if let Some(pos) = position_opt {
            if pos >= next_position {
                next_position = pos + 1;
            }
            pos
        } else {
            let assign = next_position;
            next_position += 1;
            assign
        };

        conn.execute(
            "INSERT INTO action_items (id, area_id, title, created_at, position, archived_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, area_id, title, created_at, position, archived_at],
        )
        .map_err(|e| format!("Failed to insert migrated action item: {}", e))?;
    }

    conn.execute("DROP TABLE action_items_old", [])
        .map_err(|e| format!("Failed to drop old action_items table: {}", e))?;

    Ok(())
}
