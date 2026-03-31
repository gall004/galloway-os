/**
 * @description Migration 013: Create app_settings singleton table.
 * Enforces a single configuration row via CHECK(id = 1).
 */
module.exports = {
  up: `
    CREATE TABLE app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      inbox_mode BOOLEAN DEFAULT 1,
      manager_mode BOOLEAN DEFAULT 1,
      theme_preference TEXT DEFAULT 'system'
    );

    INSERT INTO app_settings (id, inbox_mode, manager_mode, theme_preference)
    VALUES (1, 1, 1, 'system');
  `
};
