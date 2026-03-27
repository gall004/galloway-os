const { getDatabase } = require('../models/database');
const logger = require('../logger');

const TASKS_SELECT = `
  SELECT tasks.*,
    p.name AS priority,
    s.label AS status_label,
    c.name AS customer, pr.name AS project
  FROM tasks
  LEFT JOIN priorities p ON tasks.priority_id = p.id
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
 * @description Create a new task in the database.
 * @param {Object} data - Task fields (status_name key, FK IDs for priority/project/customer).
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

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, date_due, status_name, priority_id, project_id, customer_id, delegated_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.description || null,
    data.date_due || null,
    statusName,
    data.priority_id || 3,
    data.project_id || 1,
    data.customer_id || 1,
    data.delegated_to || null,
  );

  const task = db.prepare(`${TASKS_SELECT} WHERE tasks.id = ?`).get(result.lastInsertRowid);
  logger.info({ taskId: task.id }, 'Task created');
  return task;
}

/**
 * @description Retrieve all tasks with joined lookup names.
 * @returns {Array<Object>}
 */
function getAllTasks() {
  const db = getDatabase();
  return db.prepare(`${TASKS_SELECT} ORDER BY tasks.order_index ASC, tasks.date_created DESC`).all();
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

  if (updates.status_name) {
    validateStatus(db, updates.status_name);
  }

  if (updates.project_id && updates.project_id !== 1) {
    const proj = db.prepare('SELECT customer_id FROM projects WHERE id = ?').get(updates.project_id);
    if (proj && proj.customer_id !== 1 && !updates.customer_id) {
      updates.customer_id = proj.customer_id;
    }
  }

  const allowedFields = ['title', 'description', 'date_due', 'date_completed', 'status_name', 'priority_id', 'project_id', 'customer_id', 'delegated_to', 'order_index'];
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

module.exports = { createTask, getAllTasks, updateTask, deleteTask, reorderTasks };
