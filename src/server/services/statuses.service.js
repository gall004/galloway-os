const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Get all statuses with governance columns.
 * @returns {Array<Object>}
 */
function getAllStatuses() {
  const db = getDatabase();
  return db.prepare('SELECT rowid as id, name, label, system_name, is_system_locked, is_renamable FROM statuses ORDER BY rowid').all();
}

/**
 * @description Get a single status by name.
 * @param {string} name
 * @returns {Object}
 * @throws {Error} If not found.
 */
function getStatus(name) {
  const db = getDatabase();
  const row = db.prepare('SELECT rowid as id, name, label, system_name, is_system_locked, is_renamable FROM statuses WHERE name = ?').get(name);
  if (!row) {
    const err = new Error(`Status '${name}' not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }
  return row;
}

/**
 * @description Create a new custom status.
 * @param {{ name: string, label: string }} data
 * @returns {Object} The created status.
 * @throws {Error} If validation fails.
 */
function createStatus(data) {
  const db = getDatabase();

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    const err = new Error('Name is required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (!data.label || typeof data.label !== 'string' || !data.label.trim()) {
    const err = new Error('Label is required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const safeName = data.name.trim().toLowerCase().replace(/\s+/g, '_');
  db.prepare('INSERT INTO statuses (name, label, is_system_locked, is_renamable) VALUES (?, ?, 0, 1)').run(safeName, data.label.trim());
  logger.info({ statusName: safeName, label: data.label.trim() }, 'Custom status created');
  return getStatus(safeName);
}

/**
 * @description Update the display label for a status.
 * @param {string} name - The status key.
 * @param {{ label: string }} data
 * @returns {Object} The updated status.
 * @throws {Error} If not found, not renamable, or invalid.
 */
function updateStatusLabel(name, data) {
  const db = getDatabase();
  const existing = db.prepare('SELECT name, is_renamable FROM statuses WHERE name = ?').get(name);
  if (!existing) {
    const err = new Error(`Status '${name}' not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (existing.is_renamable === 0) {
    const err = new Error(`Status '${name}' cannot be renamed.`);
    err.code = 'FORBIDDEN';
    throw err;
  }

  if (!data.label || typeof data.label !== 'string' || !data.label.trim()) {
    const err = new Error('Label is required and must be a non-empty string.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  db.prepare('UPDATE statuses SET label = ? WHERE name = ?').run(data.label.trim(), name);
  logger.info({ statusName: name, newLabel: data.label.trim() }, 'Status label updated');
  return getStatus(name);
}

/**
 * @description Safe delete a status with task reassignment.
 * System-locked statuses cannot be deleted.
 * If tasks exist in the status, they are reassigned to fallbackStatusName within a transaction.
 * @param {string} name - The status key to delete.
 * @param {string} fallbackStatusName - The status to reassign orphaned tasks to.
 * @throws {Error} If locked, not found, or fallback invalid.
 */
function deleteStatus(name, fallbackStatusName) {
  const db = getDatabase();
  const existing = db.prepare('SELECT name, is_system_locked FROM statuses WHERE name = ?').get(name);
  if (!existing) {
    const err = new Error(`Status '${name}' not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (existing.is_system_locked === 1) {
    const err = new Error(`Status '${name}' is system-locked and cannot be deleted.`);
    err.code = 'FORBIDDEN';
    throw err;
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status_name = ? AND is_template = 0').get(name)?.count || 0;

  if (taskCount > 0) {
    if (!fallbackStatusName) {
      const err = new Error(`Status '${name}' has ${taskCount} tasks. Provide a fallback_status_name to reassign them.`);
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const fallback = db.prepare('SELECT name FROM statuses WHERE name = ?').get(fallbackStatusName);
    if (!fallback) {
      const err = new Error(`Fallback status '${fallbackStatusName}' not found.`);
      err.code = 'NOT_FOUND';
      throw err;
    }
  }

  const safeDelete = db.transaction(() => {
    if (taskCount > 0) {
      db.prepare('UPDATE tasks SET status_name = ? WHERE status_name = ?').run(fallbackStatusName, name);
      logger.info({ from: name, to: fallbackStatusName, count: taskCount }, 'Tasks reassigned during status deletion');
    }
    db.prepare('DELETE FROM statuses WHERE name = ?').run(name);
  });

  safeDelete();
  logger.info({ statusName: name }, 'Status deleted');
}

module.exports = { getAllStatuses, getStatus, createStatus, updateStatusLabel, deleteStatus };
