/**
 * @description Migration 014: Upgrade statuses table with system governance columns.
 * - system_name: immutable internal identifier for system-critical statuses.
 * - is_system_locked: prevents deletion of core workflow columns.
 * - is_renamable: prevents renaming (e.g., 'Done' must always be 'Done').
 */
module.exports = {
  up: `
    ALTER TABLE statuses ADD COLUMN system_name TEXT NULL;
    ALTER TABLE statuses ADD COLUMN is_system_locked BOOLEAN DEFAULT 0;
    ALTER TABLE statuses ADD COLUMN is_renamable BOOLEAN DEFAULT 1;

    UPDATE statuses SET system_name = 'inbox',     is_system_locked = 1, is_renamable = 1 WHERE name = 'inbox';
    UPDATE statuses SET system_name = 'active',    is_system_locked = 1, is_renamable = 1 WHERE name = 'active';
    UPDATE statuses SET system_name = 'delegated', is_system_locked = 1, is_renamable = 1 WHERE name = 'delegated';
    UPDATE statuses SET system_name = 'done',      is_system_locked = 1, is_renamable = 0 WHERE name = 'done';

    CREATE UNIQUE INDEX idx_statuses_system_name ON statuses(system_name) WHERE system_name IS NOT NULL;
  `
};
