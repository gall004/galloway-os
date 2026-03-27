/**
 * @description Migration 006: Create statuses reference table with immutable name PK
 * and mutable label. Replace tasks.status TEXT with tasks.status_name FK.
 */
const up = `
  CREATE TABLE statuses (
    name TEXT PRIMARY KEY,
    label TEXT NOT NULL
  );

  INSERT INTO statuses (name, label) VALUES
    ('active', 'Active'),
    ('delegated', 'Delegated / Waiting'),
    ('done', 'Done');

  CREATE TABLE tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    status_name TEXT NOT NULL DEFAULT 'active' REFERENCES statuses(name),
    priority_id INTEGER NOT NULL DEFAULT 3,
    project_id INTEGER NOT NULL DEFAULT 1,
    customer_id INTEGER NOT NULL DEFAULT 1,
    delegated_to TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (priority_id) REFERENCES priorities(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  INSERT INTO tasks_new (id, title, description, date_created, date_due, date_completed, status_name, priority_id, project_id, customer_id, delegated_to, order_index)
    SELECT id, title, description, date_created, date_due, date_completed,
      CASE
        WHEN status = 'Active' THEN 'active'
        WHEN status = 'Delegated/Waiting' THEN 'delegated'
        WHEN status = 'Done' THEN 'done'
        ELSE 'active'
      END,
      priority_id, project_id, customer_id, delegated_to, order_index
    FROM tasks;

  DROP TABLE tasks;
  ALTER TABLE tasks_new RENAME TO tasks;
`;

const down = `
  -- Revert to TEXT status column without FK
`;

module.exports = { up, down };
