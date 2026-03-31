/**
 * @description Migration 015: Add display_order to statuses and rename Delegated / Waiting.
 */
module.exports = {
  up: `
    ALTER TABLE statuses ADD COLUMN display_order INTEGER DEFAULT 0;

    UPDATE statuses SET display_order = 0 WHERE name = 'inbox';
    UPDATE statuses SET display_order = 1 WHERE name = 'active';
    UPDATE statuses SET display_order = 2, label = 'Delegated' WHERE name = 'delegated';
    UPDATE statuses SET display_order = 99 WHERE name = 'done';
  `
};
