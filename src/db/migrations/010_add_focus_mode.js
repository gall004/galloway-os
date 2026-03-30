/**
 * @description Add is_focused boolean to tasks to enable the Rule of Three Focus Mode.
 */
const up = `ALTER TABLE tasks ADD COLUMN is_focused BOOLEAN DEFAULT 0;`;

module.exports = { up };
