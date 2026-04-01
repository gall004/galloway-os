const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Retrieve the singleton app_settings row.
 * @returns {Object} The settings object.
 */
function getSettings() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM app_settings WHERE id = 1').get();
}

/**
 * @description Update the singleton app_settings row.
 * @param {Object} updates - Fields to update.
 * @returns {Object} The updated settings object.
 * @throws {Error} If validation fails.
 */
function updateSettings(updates) {
  const db = getDatabase();

  const allowedFields = ['inbox_mode', 'manager_mode', 'theme_preference', 'enable_calendar'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      if (field === 'theme_preference') {
        values.push(updates[field]);
      } else {
        values.push(updates[field] ? 1 : 0);
      }
    }
  }

  if (setClauses.length === 0) {
    const err = new Error('No valid fields provided for update.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  values.push(1);
  db.prepare(`UPDATE app_settings SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  logger.info({ updates }, 'App settings updated');
  return getSettings();
}

module.exports = { getSettings, updateSettings };
