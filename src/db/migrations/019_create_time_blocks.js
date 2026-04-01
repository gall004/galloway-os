/**
 * @description Migration 019: Create time_blocks table.
 * Enables 1-to-many scheduling of tasks across multiple time slots.
 * ON DELETE CASCADE ensures blocks auto-clean when a task is removed.
 */
module.exports = {
  up: `
    CREATE TABLE time_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      date_created TEXT NOT NULL DEFAULT (datetime('now')),
      date_updated TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_time_blocks_task ON time_blocks(task_id);
    CREATE INDEX idx_time_blocks_range ON time_blocks(start_time, end_time);
  `,
};
