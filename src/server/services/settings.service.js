const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Retrieve merged settings for app and current board.
 * @param {number} boardId - The current board to fetch settings for.
 * @returns {Object} The settings object.
 */
function getSettings(boardId = 1) {
  const db = getDatabase();
  const globalSettings = db.prepare('SELECT theme_preference FROM app_settings WHERE id = 1').get() || { theme_preference: 'system' };
  const boardSettings = db.prepare('SELECT inbox_mode, manager_mode, enable_calendar FROM boards WHERE id = ?').get(boardId) || { inbox_mode: 1, manager_mode: 1, enable_calendar: 0 };
  
  return { ...globalSettings, ...boardSettings };
}

/**
 * @description Update settings, routing to global or board table correctly.
 * @param {Object} updates - Fields to update.
 * @param {number} boardId - The current board to apply workflow settings to.
 * @returns {Object} The updated settings object.
 * @throws {Error} If validation fails.
 */
function updateSettings(updates, boardId = 1) {
  const db = getDatabase();

  const boardFields = ['inbox_mode', 'manager_mode', 'enable_calendar'];
  
  if (updates.theme_preference !== undefined) {
    db.prepare(`UPDATE app_settings SET theme_preference = ? WHERE id = 1`).run(updates.theme_preference);
  }

  const setClauses = [];
  const values = [];
  for (const field of boardFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field] ? 1 : 0);
    }
  }

  if (setClauses.length > 0) {
    values.push(boardId);
    db.prepare(`UPDATE boards SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  if (setClauses.length === 0 && updates.theme_preference === undefined) {
    const err = new Error('No valid fields provided for update.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  logger.info({ updates, boardId }, 'App/Board settings updated');
  return getSettings(boardId);
}

module.exports = { getSettings, updateSettings };
