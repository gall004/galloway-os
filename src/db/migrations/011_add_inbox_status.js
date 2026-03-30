/**
 * @description Add inbox to statuses for Phase 6 Quick Capture
 */
const up = `INSERT OR IGNORE INTO statuses (name, label) VALUES ('inbox', 'Inbox');`;

module.exports = { up };
