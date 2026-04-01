/**
 * @description Migration 017: Drop N/A Client
 * Drops the NOT NULL constraint on tasks.customer_id to natively support optional clients.
 * Converts existing tasks with customer_id=1 to NULL.
 * Deletes the N/A row (id=1) from the customers table.
 */
const up = `
  -- Temporarily disable FK enforcement for table recreation
  PRAGMA foreign_keys = OFF;

  -- Step 1: Clean up any partial runs
  DROP TABLE IF EXISTS tasks_new;

  -- Step 2: Recreate tasks to allow NULL customer_id
  CREATE TABLE tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    status_name TEXT NOT NULL DEFAULT 'active' REFERENCES statuses(name),
    project_id INTEGER NOT NULL DEFAULT 1,
    customer_id INTEGER,
    delegated_to TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    impact_statement TEXT DEFAULT NULL,
    date_delegated TEXT DEFAULT NULL,
    is_focused BOOLEAN DEFAULT 0,
    is_template BOOLEAN DEFAULT 0,
    frequency TEXT NULL,
    days_of_week TEXT NULL,
    due_date_offset_days INTEGER NULL,
    prevent_duplicates BOOLEAN DEFAULT 1,
    next_run_date TEXT NULL,
    source_recurring_task_id INTEGER NULL,
    is_active_template BOOLEAN DEFAULT 1,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  INSERT INTO tasks_new (
    id, title, description, date_created, date_due, date_completed,
    status_name, project_id, customer_id, delegated_to, order_index,
    impact_statement, date_delegated, is_focused, is_template,
    frequency, days_of_week, due_date_offset_days, prevent_duplicates,
    next_run_date, source_recurring_task_id, is_active_template
  )
  SELECT 
    id, title, description, date_created, date_due, date_completed,
    status_name, project_id, customer_id, delegated_to, order_index,
    impact_statement, date_delegated, is_focused, is_template,
    frequency, days_of_week, due_date_offset_days, prevent_duplicates,
    next_run_date, source_recurring_task_id, is_active_template
  FROM tasks;

  DROP TABLE tasks;
  ALTER TABLE tasks_new RENAME TO tasks;

  -- Step 3: Nullify existing tasks that point to N/A client
  UPDATE tasks SET customer_id = NULL WHERE customer_id = 1;

  -- Step 4: Drop the actual N/A row from customers
  DELETE FROM customers WHERE id = 1;

  -- Re-enable FK enforcement
  PRAGMA foreign_keys = ON;
`;

const down = `
  INSERT OR IGNORE INTO customers (id, name) VALUES (1, 'N/A');
  UPDATE tasks SET customer_id = 1 WHERE customer_id IS NULL;
`;

module.exports = { up, down };
