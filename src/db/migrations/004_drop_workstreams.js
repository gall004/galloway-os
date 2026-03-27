/**
 * @description Migration 004: Drop workstreams table and remove workstream_id from tasks.
 * Recreates tasks table without workstream_id column.
 */
const up = `
  -- Recreate tasks without workstream_id
  CREATE TABLE tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    priority_id INTEGER NOT NULL DEFAULT 3,
    status_id INTEGER NOT NULL DEFAULT 2,
    project_id INTEGER NOT NULL DEFAULT 1,
    customer_id INTEGER NOT NULL DEFAULT 1,
    delegated_to TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (priority_id) REFERENCES priorities(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  INSERT INTO tasks_new (id, title, description, date_created, date_due, date_completed, priority_id, status_id, project_id, customer_id, delegated_to, order_index)
    SELECT id, title, description, date_created, date_due, date_completed, priority_id, status_id, project_id, customer_id, delegated_to, order_index FROM tasks;

  DROP TABLE tasks;
  ALTER TABLE tasks_new RENAME TO tasks;

  DROP TABLE IF EXISTS workstreams;
`;

const down = `
  CREATE TABLE IF NOT EXISTS workstreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO workstreams (name) VALUES ('N/A'), ('Mark Eichten'), ('Garrett Stuart'), ('Caleb Johnson');
`;

module.exports = { up, down };
