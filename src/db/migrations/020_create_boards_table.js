/**
 * @description Migration 020: Create boards table and migrate existing workflow settings.
 */
module.exports = {
  up: `
    CREATE TABLE boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      inbox_mode BOOLEAN DEFAULT 1,
      manager_mode BOOLEAN DEFAULT 1,
      enable_calendar BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO boards (id, name, inbox_mode, manager_mode, enable_calendar)
    SELECT 1, 'Main Workspace', inbox_mode, manager_mode, enable_calendar
    FROM app_settings WHERE id = 1;
  `
};
