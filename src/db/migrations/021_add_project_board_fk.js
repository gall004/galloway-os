/**
 * @description Migration 021: Link projects implicitly to a workspace.
 */
module.exports = {
  up: `
  PRAGMA foreign_keys = OFF;
  
  CREATE TABLE projects_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    board_id INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );
  
  INSERT INTO projects_new (id, name, customer_id, board_id)
  SELECT id, name, customer_id, 1 FROM projects;
  
  DROP TABLE projects;
  ALTER TABLE projects_new RENAME TO projects;
  
  PRAGMA foreign_keys = ON;
`
};
