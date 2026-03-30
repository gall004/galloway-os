/**
 * @description Add impact_statement column to tasks for capturing completion context.
 */
const up = `ALTER TABLE tasks ADD COLUMN impact_statement TEXT DEFAULT NULL`;

module.exports = { up };
