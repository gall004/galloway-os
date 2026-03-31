/**
 * @description Morph tasks to natively handle recurring template logic without a secondary shadow table.
 */
module.exports = {
  up: `
    -- Wipe the old shadow table completely just in case a stale schema exists natively on the user engine
    DROP TABLE IF EXISTS recurring_tasks;

    -- Inject polymorphic template markers
    ALTER TABLE tasks ADD COLUMN is_template BOOLEAN DEFAULT 0;
    
    -- Inject recurring scheduling properties
    ALTER TABLE tasks ADD COLUMN frequency TEXT NULL;
    ALTER TABLE tasks ADD COLUMN days_of_week TEXT NULL;
    ALTER TABLE tasks ADD COLUMN due_date_offset_days INTEGER NULL;
    ALTER TABLE tasks ADD COLUMN prevent_duplicates BOOLEAN DEFAULT 1;
    ALTER TABLE tasks ADD COLUMN next_run_date TEXT NULL;
    ALTER TABLE tasks ADD COLUMN source_recurring_task_id INTEGER NULL;
    ALTER TABLE tasks ADD COLUMN is_active_template BOOLEAN DEFAULT 1;
  `
};
