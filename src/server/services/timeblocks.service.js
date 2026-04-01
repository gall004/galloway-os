const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Retrieve time blocks within a date range.
 * @param {string} startDate - ISO 8601 start of range.
 * @param {string} endDate - ISO 8601 end of range.
 * @returns {Array} Array of time block objects with joined task data.
 */
function getTimeBlocks(startDate, endDate) {
  const db = getDatabase();
  return db.prepare(`
    SELECT tb.*, t.title AS task_title, t.status_name,
      p.name AS project_name, c.name AS customer_name
    FROM time_blocks tb
    JOIN tasks t ON tb.task_id = t.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE tb.start_time < ? AND tb.end_time > ?
    ORDER BY tb.start_time ASC
  `).all(endDate, startDate);
}

/**
 * @description Create a new time block.
 * @param {Object} data - { task_id, start_time, end_time }
 * @returns {Object} The created time block with id.
 * @throws {Error} If validation fails.
 */
function createTimeBlock(data) {
  const db = getDatabase();
  const { task_id, start_time, end_time } = data;

  if (!task_id || !start_time || !end_time) {
    const err = new Error('task_id, start_time, and end_time are required.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (new Date(end_time) <= new Date(start_time)) {
    const err = new Error('end_time must be after start_time.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(task_id);
  if (!task) {
    const err = new Error(`Task with id ${task_id} not found.`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }

  const result = db.prepare(`
    INSERT INTO time_blocks (task_id, start_time, end_time)
    VALUES (?, ?, ?)
  `).run(task_id, start_time, end_time);

  logger.info({ timeBlockId: result.lastInsertRowid, task_id }, 'Time block created');
  return { id: result.lastInsertRowid, task_id, start_time, end_time };
}

/**
 * @description Update a time block's start/end times.
 * @param {number} id - Time block ID.
 * @param {Object} data - { start_time, end_time }
 * @returns {Object} The updated time block.
 * @throws {Error} If not found or validation fails.
 */
function updateTimeBlock(id, data) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(id);

  if (!existing) {
    const err = new Error(`Time block with id ${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const start = data.start_time || existing.start_time;
  const end = data.end_time || existing.end_time;

  if (new Date(end) <= new Date(start)) {
    const err = new Error('end_time must be after start_time.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  db.prepare(`
    UPDATE time_blocks SET start_time = ?, end_time = ?, date_updated = datetime('now')
    WHERE id = ?
  `).run(start, end, id);

  logger.info({ timeBlockId: id }, 'Time block updated');
  return db.prepare('SELECT * FROM time_blocks WHERE id = ?').get(id);
}

/**
 * @description Delete a time block.
 * @param {number} id - Time block ID.
 * @throws {Error} If not found.
 */
function deleteTimeBlock(id) {
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM time_blocks WHERE id = ?').get(id);

  if (!existing) {
    const err = new Error(`Time block with id ${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  db.prepare('DELETE FROM time_blocks WHERE id = ?').run(id);
  logger.info({ timeBlockId: id }, 'Time block deleted');
}

module.exports = { getTimeBlocks, createTimeBlock, updateTimeBlock, deleteTimeBlock };
