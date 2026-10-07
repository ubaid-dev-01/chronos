use rusqlite::{Connection, params};
use std::path::Path;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingTimeLog {
    pub id: i64,
    pub user_id: String,
    pub project_id: String,
    pub task_id: Option<String>,
    pub start_time: i64,
    pub end_time: i64,
    pub activity_score: f64,
    pub is_offline: bool,
    pub window_title: Option<String>,
    pub process_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingScreenshot {
    pub id: i64,
    pub timelog_id: i64,
    pub image_data: Vec<u8>,
    pub timestamp: i64,
    pub is_blurred: bool,
    pub sha256_hash: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, String> {
        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        let db = Self { conn: Mutex::new(conn) };
        db.run_migrations()?;
        Ok(db)
    }

    fn run_migrations(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS timelogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                task_id TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                activity_score REAL DEFAULT 0.0,
                is_offline INTEGER DEFAULT 0,
                window_title TEXT,
                process_name TEXT,
                synced INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timelog_id INTEGER NOT NULL,
                image_data BLOB NOT NULL,
                timestamp INTEGER NOT NULL,
                is_blurred INTEGER DEFAULT 1,
                synced INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (timelog_id) REFERENCES timelogs(id)
            );

            CREATE TABLE IF NOT EXISTS auth (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_timelogs_synced ON timelogs(synced);
            CREATE INDEX IF NOT EXISTS idx_screenshots_synced ON screenshots(synced);
        ").map_err(|e| format!("Migration failed: {}", e))?;

        let _ = conn.execute("ALTER TABLE timelogs ADD COLUMN task_id TEXT", []);
        let _ = conn.execute("ALTER TABLE screenshots ADD COLUMN sha256_hash TEXT", []);
        Ok(())
    }

    pub fn insert_timelog(&self, log: &PendingTimeLog) -> Result<i64, String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO timelogs (user_id, project_id, task_id, start_time, end_time, activity_score, is_offline, window_title, process_name)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                log.user_id, log.project_id, log.task_id, log.start_time, log.end_time,
                log.activity_score, log.is_offline as i32,
                log.window_title, log.process_name,
            ],
        ).map_err(|e| format!("Insert failed: {}", e))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_unsynced_timelogs(&self, limit: usize) -> Result<Vec<PendingTimeLog>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, user_id, project_id, task_id, start_time, end_time, activity_score, is_offline, window_title, process_name FROM timelogs WHERE synced = 0 ORDER BY start_time ASC LIMIT ?1")
            .map_err(|e| format!("Query failed: {}", e))?;

        let logs = stmt.query_map(params![limit as i64], |row| {
            Ok(PendingTimeLog {
                id: row.get(0)?,
                user_id: row.get(1)?,
                project_id: row.get(2)?,
                task_id: row.get(3)?,
                start_time: row.get(4)?,
                end_time: row.get(5)?,
                activity_score: row.get(6)?,
                is_offline: row.get::<_, i32>(7)? != 0,
                window_title: row.get(8)?,
                process_name: row.get(9)?,
            })
        }).map_err(|e| format!("Mapping failed: {}", e))?;

        logs.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Collection failed: {}", e))
    }

    pub fn get_latest_open_timelog_id(&self) -> Result<Option<i64>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id FROM timelogs WHERE synced = 0 ORDER BY id DESC LIMIT 1")
            .map_err(|e| format!("Query failed: {}", e))?;
        let result = stmt.query_row([], |row| row.get(0)).ok();
        Ok(result)
    }

    pub fn mark_timelog_synced(&self, id: i64) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE timelogs SET synced = 1 WHERE id = ?1", params![id])
            .map_err(|e| format!("Update failed: {}", e))?;
        Ok(())
    }

    pub fn insert_screenshot(&self, screenshot: &PendingScreenshot) -> Result<i64, String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO screenshots (timelog_id, image_data, timestamp, is_blurred, sha256_hash) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                screenshot.timelog_id,
                screenshot.image_data,
                screenshot.timestamp,
                screenshot.is_blurred as i32,
                screenshot.sha256_hash,
            ],
        ).map_err(|e| format!("Insert failed: {}", e))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_unsynced_screenshots(&self, limit: usize) -> Result<Vec<PendingScreenshot>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, timelog_id, image_data, timestamp, is_blurred, sha256_hash FROM screenshots WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?1")
            .map_err(|e| format!("Query failed: {}", e))?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok(PendingScreenshot {
                id: row.get(0)?,
                timelog_id: row.get(1)?,
                image_data: row.get(2)?,
                timestamp: row.get(3)?,
                is_blurred: row.get::<_, i32>(4)? != 0,
                sha256_hash: row.get(5)?,
            })
        }).map_err(|e| format!("Mapping failed: {}", e))?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Collection failed: {}", e))
    }

    pub fn mark_screenshot_synced(&self, id: i64) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE screenshots SET synced = 1 WHERE id = ?1", params![id])
            .map_err(|e| format!("Update failed: {}", e))?;
        Ok(())
    }

    pub fn save_auth_session(&self, access_token: &str, refresh_token: &str) -> Result<(), String> {
        self.save_auth_value("access_token", access_token)?;
        self.save_auth_value("refresh_token", refresh_token)?;
        Ok(())
    }

    pub fn save_auth_value(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO auth (key, value) VALUES (?1, ?2)",
            params![key, value],
        ).map_err(|e| format!("Save auth failed: {}", e))?;
        Ok(())
    }

    pub fn get_auth_value(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT value FROM auth WHERE key = ?1")
            .map_err(|e| format!("Query failed: {}", e))?;
        let result = stmt.query_row(params![key], |row| row.get(0)).ok();
        Ok(result)
    }

    pub fn get_auth_token(&self) -> Result<Option<String>, String> {
        self.get_auth_value("access_token")
    }

    pub fn clear_auth(&self) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM auth", [])
            .map_err(|e| format!("Clear auth failed: {}", e))?;
        Ok(())
    }

    pub fn cleanup_old_data(&self, days: i64) -> Result<usize, String> {
        let conn = self.conn.lock().unwrap();
        let cutoff = chrono::Utc::now().timestamp_millis() - (days * 86400 * 1000);

        let d1 = conn.execute(
            "DELETE FROM screenshots WHERE synced = 1 AND timestamp < ?1", params![cutoff],
        ).map_err(|e| format!("Cleanup failed: {}", e))?;

        let d2 = conn.execute(
            "DELETE FROM timelogs WHERE synced = 1 AND end_time < ?1", params![cutoff],
        ).map_err(|e| format!("Cleanup failed: {}", e))?;

        Ok(d1 + d2)
    }

    pub fn get_today_tracked_seconds(&self) -> Result<(u64, Option<String>), String> {
        let conn = self.conn.lock().unwrap();
        // start_time/end_time are epoch millis
        let day_start = {
            let now = chrono::Utc::now();
            let naive = now.date_naive().and_hms_opt(0, 0, 0).unwrap();
            naive.and_utc().timestamp_millis()
        };
        let mut stmt = conn
            .prepare(
                "SELECT COALESCE(SUM(end_time - start_time), 0),
                        (SELECT window_title FROM timelogs WHERE start_time >= ?1 ORDER BY end_time DESC LIMIT 1)
                 FROM timelogs WHERE start_time >= ?1",
            )
            .map_err(|e| format!("Query failed: {}", e))?;
        let (sum_ms, last_window): (i64, Option<String>) = stmt
            .query_row(params![day_start], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| format!("Query failed: {}", e))?;
        Ok(((sum_ms.max(0) as u64) / 1000, last_window))
    }

    pub fn count_pending(&self) -> Result<(usize, usize), String> {
        let conn = self.conn.lock().unwrap();
        let logs: i64 = conn
            .query_row("SELECT COUNT(*) FROM timelogs WHERE synced = 0", [], |r| r.get(0))
            .unwrap_or(0);
        let shots: i64 = conn
            .query_row("SELECT COUNT(*) FROM screenshots WHERE synced = 0", [], |r| r.get(0))
            .unwrap_or(0);
        Ok((logs as usize, shots as usize))
    }
}
