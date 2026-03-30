/**
 * @description Add date_delegated column to tasks for delegation SLA tracking.
 */
const up = `ALTER TABLE tasks ADD COLUMN date_delegated TEXT DEFAULT NULL`;

module.exports = { up };
