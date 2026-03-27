const { getDatabase } = require('../models/database');
const logger = require('../logger');

const TASKS_SELECT = `
  SELECT tasks.*,
    p.name AS priority, s.name AS status,
    c.name AS customer, pr.name AS project
  FROM tasks
  LEFT JOIN priorities p ON tasks.priority_id = p.id
  LEFT JOIN statuses s ON tasks.status_id = s.id
  LEFT JOIN customers c ON tasks.customer_id = c.id
  LEFT JOIN projects pr ON tasks.project_id = pr.id
`;

/**
 * @description Create a new task in the database.
 * @param {Object} data - Task fields (accepts FK IDs).
 * @returns {Object} The created task with joined names.
 * @throws {Error} If validation fails.
 */
function createTask(data) {
  const db = getDatabase();

  if (data.project_id && data.project_id !== 1) {
    const proj = db.prepare('SELECT customer_id FROM projects WHERE id = ?').get(data.project_id);
    if (proj && proj.customer_id !== 1) {
      data.customer_id = proj.customer_id;
    }
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, date_due, priority_id, status_id, project_id, customer_id, delegated_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.description || null,
    data.date_due || null,
    data.priority_id || 3,
    data.status_id || 2,
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
 * @param {Object} updates - Fields to update (FK IDs or scalar fields).
 * @returns {Object} The updated task with joined names.
 * @throws {Error} If not found.
 */
function updateTask(id, updates) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!existing) {
    const err = new Error(`Task with id ${id} not found`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }

  if (updates.project_id && updates.project_id !== 1) {
    const proj = db.prepare('SELECT customer_id FROM projects WHERE id = ?').get(updates.project_id);
    if (proj && proj.customer_id !== 1 && !updates.customer_id) {
      updates.customer_id = proj.customer_id;
    }
  }

  const allowedFields = ['title', 'description', 'date_due', 'date_completed', 'priority_id', 'status_id', 'project_id', 'customer_id', 'delegated_to', 'order_index'];
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
