/**
 * @description Migration 016: Make customer_id optional on projects.
 * Recreates projects table with nullable customer_id (no NOT NULL, no DEFAULT).
 * Preserves all existing data. Converts sentinel N/A references (customer_id = 1)
 * to NULL so that NULL consistently means "no client associated".
 */
const up = `
  -- Temporarily disable FK enforcement for table recreation
  PRAGMA foreign_keys = OFF;

  -- Clean up any partial runs
  DROP TABLE IF EXISTS projects_new;

  -- Recreate projects with nullable customer_id
  CREATE TABLE projects_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
  INSERT INTO projects_new (id, name, customer_id)
    SELECT id, name, customer_id FROM projects;
  DROP TABLE projects;
  ALTER TABLE projects_new RENAME TO projects;

  -- Convert sentinel N/A (id=1) references to NULL on projects
  UPDATE projects SET customer_id = NULL WHERE customer_id = 1;

  -- Re-enable FK enforcement
  PRAGMA foreign_keys = ON;
`;

const down = `
  UPDATE projects SET customer_id = 1 WHERE customer_id IS NULL;
`;

module.exports = { up, down };
