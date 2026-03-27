/**
 * @description Migration 007: Drop priorities table, remove priority_id from tasks.
 * Priority is now expressed purely through vertical ordering (order_index).
 */
const up = `
  CREATE TABLE tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    status_name TEXT NOT NULL DEFAULT 'active' REFERENCES statuses(name),
    project_id INTEGER NOT NULL DEFAULT 1,
    customer_id INTEGER NOT NULL DEFAULT 1,
    delegated_to TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  INSERT INTO tasks_new (id, title, description, date_created, date_due, date_completed, status_name, project_id, customer_id, delegated_to, order_index)
    SELECT id, title, description, date_created, date_due, date_completed, status_name, project_id, customer_id, delegated_to, order_index
    FROM tasks;

  DROP TABLE tasks;
  ALTER TABLE tasks_new RENAME TO tasks;

  DROP TABLE IF EXISTS priorities;
`;

const down = `
  -- Revert: recreate priorities table
`;

module.exports = { up, down };
