/**
 * @description Migration 005: Simplify statuses — drop statuses table,
 * replace status_id with a TEXT status column.
 * Maps: Backlog, Next Up, In Progress → Active. Delegated/Waiting → Delegated/Waiting. Done → Done.
 */
const up = `
  CREATE TABLE tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Delegated/Waiting', 'Done')),
    priority_id INTEGER NOT NULL DEFAULT 3,
    project_id INTEGER NOT NULL DEFAULT 1,
    customer_id INTEGER NOT NULL DEFAULT 1,
    delegated_to TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (priority_id) REFERENCES priorities(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  INSERT INTO tasks_new (id, title, description, date_created, date_due, date_completed, status, priority_id, project_id, customer_id, delegated_to, order_index)
    SELECT t.id, t.title, t.description, t.date_created, t.date_due, t.date_completed,
      CASE
        WHEN s.name IN ('Backlog', 'Next Up', 'In Progress', 'N/A') THEN 'Active'
        WHEN s.name = 'Delegated/Waiting' THEN 'Delegated/Waiting'
        WHEN s.name = 'Done' THEN 'Done'
        ELSE 'Active'
      END,
      t.priority_id, t.project_id, t.customer_id, t.delegated_to, t.order_index
    FROM tasks t
    LEFT JOIN statuses s ON t.status_id = s.id;

  DROP TABLE tasks;
  ALTER TABLE tasks_new RENAME TO tasks;

  DROP TABLE IF EXISTS statuses;
`;

const down = `
  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO statuses (name) VALUES ('N/A'), ('Backlog'), ('Next Up'), ('In Progress'), ('Delegated/Waiting'), ('Done');
`;

module.exports = { up, down };
