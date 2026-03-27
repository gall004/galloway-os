/**
 * @description Initial migration: Create the tasks table.
 * Establishes the core schema for the Priority task management system.
 */
const up = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date_created TEXT NOT NULL DEFAULT (datetime('now')),
    date_due TEXT,
    date_completed TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Backlog' CHECK (status IN ('Backlog', 'Next Up', 'In Progress', 'Delegated/Waiting', 'Done')),
    associated_project TEXT,
    associated_customer TEXT,
    delegated_to TEXT,
    workstream TEXT NOT NULL DEFAULT 'None' CHECK (workstream IN ('None', 'Mark Eichten', 'Garrett Stuart', 'Caleb Johnson'))
  );
`;

const down = `DROP TABLE IF EXISTS tasks;`;

module.exports = { up, down };
