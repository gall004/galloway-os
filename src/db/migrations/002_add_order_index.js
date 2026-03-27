/**
 * @description Migration: Add order_index column for vertical sorting in Priority.
 */
const up = `ALTER TABLE tasks ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;`;

const down = `ALTER TABLE tasks DROP COLUMN order_index;`;

module.exports = { up, down };
