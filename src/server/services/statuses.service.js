const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Get all statuses.
 * @returns {Array<{name: string, label: string}>}
 */
function getAllStatuses() {
  const db = getDatabase();
  return db.prepare('SELECT name, label FROM statuses ORDER BY rowid').all();
}

/**
 * @description Get a single status by name (PK).
 * @param {string} name
 * @returns {{ name: string, label: string }}
 * @throws {Error} If not found.
 */
function getStatus(name) {
  const db = getDatabase();
  const row = db.prepare('SELECT name, label FROM statuses WHERE name = ?').get(name);
  if (!row) {
    const err = new Error(`Status '${name}' not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }
  return row;
}

/**
 * @description Update the display label for a status. Name (PK) is immutable.
 * @param {string} name - The immutable status key.
 * @param {{ label: string }} data
 * @returns {{ name: string, label: string }}
 * @throws {Error} If not found or invalid.
 */
function updateStatusLabel(name, data) {
  const db = getDatabase();
  const existing = db.prepare('SELECT name FROM statuses WHERE name = ?').get(name);
  if (!existing) {
    const err = new Error(`Status '${name}' not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (!data.label || typeof data.label !== 'string' || !data.label.trim()) {
    const err = new Error('Label is required and must be a non-empty string.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  db.prepare('UPDATE statuses SET label = ? WHERE name = ?').run(data.label.trim(), name);
  logger.info({ statusName: name, newLabel: data.label.trim() }, 'Status label updated');
  return db.prepare('SELECT name, label FROM statuses WHERE name = ?').get(name);
}

module.exports = { getAllStatuses, getStatus, updateStatusLabel };
