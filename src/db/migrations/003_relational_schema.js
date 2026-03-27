/**
 * @description Migration 003: Create relational lookup tables and refactor tasks.
 * Creates priorities, statuses, workstreams, customers, projects tables.
 * Drops and recreates tasks with foreign key columns.
 */
const up = `
  -- Lookup tables
  CREATE TABLE IF NOT EXISTS priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO priorities (name) VALUES ('N/A'), ('Low'), ('Medium'), ('High'), ('Critical');

  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO statuses (name) VALUES ('N/A'), ('Backlog'), ('Next Up'), ('In Progress'), ('Delegated/Waiting'), ('Done');

  CREATE TABLE IF NOT EXISTS workstreams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO workstreams (name) VALUES ('N/A'), ('Mark Eichten'), ('Garrett Stuart'), ('Caleb Johnson');

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  INSERT OR IGNORE INTO customers (name) VALUES ('N/A');

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
  INSERT OR IGNORE INTO projects (name, customer_id) VALUES ('N/A', 1);

  -- Drop old tasks table and recreate with FKs
  DROP TABLE IF EXISTS tasks;
  CREATE TABLE tasks (
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
    workstream_id INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (priority_id) REFERENCES priorities(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (workstream_id) REFERENCES workstreams(id)
  );
`;

const down = `
  DROP TABLE IF EXISTS tasks;
  DROP TABLE IF EXISTS projects;
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS workstreams;
  DROP TABLE IF EXISTS statuses;
  DROP TABLE IF EXISTS priorities;
`;

module.exports = { up, down };
