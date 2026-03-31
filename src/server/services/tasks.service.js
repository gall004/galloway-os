const { getDatabase } = require('../models/database');
const logger = require('../logger');

const TASKS_SELECT = `
  SELECT tasks.*,
    s.label AS status_label,
    c.name AS customer, pr.name AS project
  FROM tasks
  LEFT JOIN statuses s ON tasks.status_name = s.name
  LEFT JOIN customers c ON tasks.customer_id = c.id
  LEFT JOIN projects pr ON tasks.project_id = pr.id
`;

/**
 * @description Validate status_name against the statuses reference table.
 * @param {Object} db - Database instance.
 * @param {string} statusName - The status key to validate.
 * @throws {Error} If status not found.
 */
function validateStatus(db, statusName) {
  const row = db.prepare('SELECT name FROM statuses WHERE name = ?').get(statusName);
  if (!row) {
    const err = new Error(`Invalid status_name '${statusName}'. Must be a valid status key.`);
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

/**
 * @description Shift order_index of tasks in a column to make room for insertion.
 * @param {Object} db - Database instance.
 * @param {string} statusName - Target status column.
 * @param {number} fromIndex - Index at which to insert (shift everything >= this).
 */
function shiftOrderIndexes(db, statusName, fromIndex) {
  db.prepare('UPDATE tasks SET order_index = order_index + 1 WHERE status_name = ? AND order_index >= ?').run(statusName, fromIndex);
}

/**
 * @description Create a new task. If order_index is provided, shifts existing tasks to make room.
 * @param {Object} data - Task fields.
 * @returns {Object} The created task with joined names.
 * @throws {Error} If validation fails.
 */
function createTask(data) {
  const db = getDatabase();
  const statusName = data.status_name || 'active';

  validateStatus(db, statusName);

  if (data.project_id && data.project_id !== 1) {
    const proj = db.prepare('SELECT customer_id FROM projects WHERE id = ?').get(data.project_id);
    if (proj && proj.customer_id !== 1) {
      data.customer_id = proj.customer_id;
    }
  }

  const orderIndex = data.order_index !== null && data.order_index !== undefined ? data.order_index : 0;
  let isFocused = data.is_focused ? 1 : 0;

  if (isFocused === 1 && statusName !== 'active') {
    isFocused = 0;
  }

  if (isFocused === 1) {
    const focusCount = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE is_focused = 1 AND status_name = 'active'").get().c;
    if (focusCount >= 3) {
      const err = new Error('Maximum of 3 focus tasks allowed. Unpin one first.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  if (data.order_index !== null && data.order_index !== undefined) {
    shiftOrderIndexes(db, statusName, orderIndex);
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, date_due, status_name, project_id, customer_id, delegated_to, order_index, is_focused, is_template, frequency, days_of_week, due_date_offset_days, prevent_duplicates, next_run_date, source_recurring_task_id, is_active_template)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.description || null,
    data.date_due || null,
    statusName,
    data.project_id || 1,
    data.customer_id || 1,
    data.delegated_to || null,
    orderIndex,
    isFocused,
    data.is_template ? 1 : 0,
    data.frequency || null,
    data.days_of_week ? JSON.stringify(data.days_of_week) : null,
    data.due_date_offset_days !== undefined ? data.due_date_offset_days : null,
    data.prevent_duplicates !== undefined ? (data.prevent_duplicates ? 1 : 0) : 1,
    data.next_run_date || null,
    data.source_recurring_task_id || null,
    data.is_active_template !== undefined ? (data.is_active_template ? 1 : 0) : 1
  );

  const task = db.prepare(`${TASKS_SELECT} WHERE tasks.id = ?`).get(result.lastInsertRowid);
  logger.info({ taskId: task.id }, 'Task created');
  return task;
}

/**
 * @description Retrieve all tasks with joined lookup names.
 * @returns {Array<Object>}
 */
function getAllTasks(opts = {}) {
  const db = getDatabase();
  const baseWhere = opts.is_template ? 'WHERE tasks.is_template = 1' : 'WHERE tasks.is_template = 0';
  return db.prepare(`${TASKS_SELECT} ${baseWhere} ORDER BY tasks.order_index ASC, tasks.date_created DESC`).all();
}

/**
 * @description Update an existing task by ID.
 * @param {number} id - Task ID.
 * @param {Object} updates - Fields to update.
 * @returns {Object} The updated task with joined names.
 * @throws {Error} If not found or invalid.
 */
function updateTask(id, updates) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!existing) {
    const err = new Error(`Task with id ${id} not found`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }

  if (updates.status_name && updates.status_name !== existing.status_name) {
    validateStatus(db, updates.status_name);
    if (updates.status_name === 'done') {
      updates.date_completed = new Date().toISOString();
    } else if (existing.status_name === 'done') {
      updates.date_completed = null;
    }

    if (updates.status_name === 'delegated' && existing.status_name !== 'delegated') {
      updates.date_delegated = new Date().toISOString();
    } else if (existing.status_name === 'delegated' && updates.status_name === 'active') {
      updates.date_delegated = null;
    }
  }

  if (updates.project_id && updates.project_id !== 1) {
    const proj = db.prepare('SELECT customer_id FROM projects WHERE id = ?').get(updates.project_id);
    if (proj && proj.customer_id !== 1 && !updates.customer_id) {
      updates.customer_id = proj.customer_id;
    }
  }

  const finalStatus = updates.status_name || existing.status_name;
  if (finalStatus !== 'active') {
    updates.is_focused = 0;
  }

  const isBecomingFocused = (updates.is_focused === 1 || updates.is_focused === true) && existing.is_focused === 0;

  if (isBecomingFocused && finalStatus === 'active') {
    const focusCount = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE is_focused = 1 AND status_name = 'active'").get().c;
    if (focusCount >= 3) {
      const err = new Error('Maximum of 3 focus tasks allowed. Unpin one first.');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  if (updates.is_focused !== undefined) {
    updates.is_focused = updates.is_focused ? 1 : 0;
  }

  const allowedFields = ['title', 'description', 'date_due', 'date_completed', 'date_delegated', 'status_name', 'project_id', 'customer_id', 'delegated_to', 'order_index', 'impact_statement', 'is_focused', 'is_template', 'frequency', 'days_of_week', 'due_date_offset_days', 'prevent_duplicates', 'next_run_date', 'source_recurring_task_id', 'is_active_template'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      if (field === 'days_of_week') {
         values.push(updates[field] ? JSON.stringify(updates[field]) : null);
      } else if (['is_template', 'prevent_duplicates', 'is_active_template', 'is_focused'].includes(field)) {
         values.push(updates[field] ? 1 : 0);
      } else {
         values.push(updates[field]);
      }
    }
  }

  if (setClauses.length > 0) {
    values.push(id);
    db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare(`${TASKS_SELECT} WHERE tasks.id = ?`).get(id);
  logger.info({ taskId: id }, 'Task updated');
  return updated;
}

/**
 * @description Delete a task by ID.
 * @param {number} id
 * @throws {Error} If not found.
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
 * @description Bulk-update order_index for drag-and-drop reorder.
 * @param {Array<{id: number, order_index: number}>} items
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

/**
 * @description Bulk reassign tasks from one status to another.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {number} The amount of tasks updated.
 */
function bulkReassignTasks(fromStatus, toStatus) {
  const db = getDatabase();
  validateStatus(db, fromStatus);
  validateStatus(db, toStatus);
  
  const result = db.prepare('UPDATE tasks SET status_name = ? WHERE status_name = ? AND is_template = 0').run(toStatus, fromStatus);
  logger.info({ fromStatus, toStatus, count: result.changes }, 'Tasks bulk reassigned');
  return result.changes;
}

module.exports = { createTask, getAllTasks, updateTask, deleteTask, reorderTasks, bulkReassignTasks };
