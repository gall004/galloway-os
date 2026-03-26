const { getDatabase } = require('../models/database');
const logger = require('../logger');

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES = ['Backlog', 'Next Up', 'In Progress', 'Delegated/Waiting', 'Done'];
const VALID_WORKSTREAMS = ['None', 'Mark Eichten', 'Garrett Stuart', 'Caleb Johnson'];

/**
 * @description Validate task fields against allowed enum values.
 * @param {Object} fields - The fields to validate.
 * @returns {{ valid: boolean, message: string }} Validation result.
 */
function validateTaskFields(fields) {
  if (fields.priority && !VALID_PRIORITIES.includes(fields.priority)) {
    return { valid: false, message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` };
  }
  if (fields.status && !VALID_STATUSES.includes(fields.status)) {
    return { valid: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` };
  }
  if (fields.workstream && !VALID_WORKSTREAMS.includes(fields.workstream)) {
    return { valid: false, message: `Invalid workstream. Must be one of: ${VALID_WORKSTREAMS.join(', ')}` };
  }
  return { valid: true, message: '' };
}

/**
 * @description Create a new task in the database.
 * @param {Object} taskData - Task fields from request body.
 * @returns {Object} The created task row.
 * @throws {Error} If validation fails.
 */
function createTask(taskData) {
  const { title, description, date_due, priority, status, associated_project, associated_customer, delegated_to, workstream } = taskData;

  const validation = validateTaskFields({ priority, status, workstream });
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, date_due, priority, status, associated_project, associated_customer, delegated_to, workstream)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title,
    description || null,
    date_due || null,
    priority || 'Medium',
    status || 'Backlog',
    associated_project || null,
    associated_customer || null,
    delegated_to || null,
    workstream || 'None',
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  logger.info({ taskId: task.id }, 'Task created');
  return task;
}

/**
 * @description Retrieve all tasks from the database, ordered by order_index.
 * @returns {Array<Object>} Array of task rows.
 */
function getAllTasks() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM tasks ORDER BY order_index ASC, date_created DESC').all();
}

/**
 * @description Update an existing task by ID.
 * @param {number} id - The task ID.
 * @param {Object} updates - Fields to update.
 * @returns {Object} The updated task row.
 * @throws {Error} If task not found or validation fails.
 */
function updateTask(id, updates) {
  const validation = validateTaskFields(updates);
  if (!validation.valid) {
    const err = new Error(validation.message);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!existing) {
    const err = new Error(`Task with id ${id} not found`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }

  const allowedFields = ['title', 'description', 'date_due', 'date_completed', 'priority', 'status', 'associated_project', 'associated_customer', 'delegated_to', 'workstream', 'order_index'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  logger.info({ taskId: id }, 'Task updated');
  return updated;
}

/**
 * @description Delete a task by ID.
 * @param {number} id - The task ID.
 * @throws {Error} If task not found.
 */
function deleteTask(id) {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  if (result.changes === 0) {
    const err = new Error(`Task with id ${id} not found`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }

  logger.info({ taskId: id }, 'Task deleted');
}

/**
 * @description Bulk-update order_index for multiple tasks (drag-and-drop reorder).
 * @param {Array<{id: number, order_index: number}>} items - Array of id + order_index pairs.
 */
function reorderTasks(items) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE tasks SET order_index = ? WHERE id = ?');

  const txn = db.transaction((rows) => {
    for (const { id, order_index } of rows) {
      stmt.run(order_index, id);
    }
  });

  txn(items);
  logger.info({ count: items.length }, 'Tasks reordered');
}

module.exports = { createTask, getAllTasks, updateTask, deleteTask, reorderTasks };
