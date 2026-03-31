const express = require('express');
const { createTask, getAllTasks, updateTask, deleteTask, reorderTasks, bulkReassignTasks } = require('../services/tasks.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description Parse and validate a numeric ID parameter.
 * @param {string} rawId
 * @returns {number}
 * @throws {Error} If invalid.
 */
function parseId(rawId) {
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    const err = new Error('Invalid task ID. Must be a positive integer.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return id;
}

/**
 * @description POST /api/tasks — Create a new task.
 */
router.post('/api/tasks', (req, res) => {
  if (!req.body?.title || typeof req.body.title !== 'string' || !req.body.title.trim()) {
    return res.status(400).json({ error: true, message: 'Title is required and must be a non-empty string.', code: 'VALIDATION_ERROR' });
  }
  try {
    const task = createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    logger.warn({ err: err.message }, 'Task creation failed');
    const status = err.code === 'VALIDATION_ERROR' || err.message?.includes('FOREIGN KEY') ? 400 : 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'VALIDATION_ERROR' });
  }
});

/**
 * @description GET /api/tasks — Retrieve all tasks with joined names.
 */
router.get('/api/tasks', (req, res) => {
  try {
    const isTemplate = req.query.is_template === 'true';
    const tasks = getAllTasks({ is_template: isTemplate });
    res.json(tasks);
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to retrieve tasks');
    res.status(500).json({ error: true, message: 'Failed to retrieve tasks.', code: 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/tasks/reorder — Bulk-update order_index.
 */
router.put('/api/tasks/reorder', (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: true, message: 'Body must be a non-empty array of { id, order_index }.', code: 'VALIDATION_ERROR' });
  }
  for (const item of req.body) {
    if (!Number.isInteger(item.id) || item.id <= 0 || !Number.isInteger(item.order_index)) {
      return res.status(400).json({ error: true, message: 'Each item must have integer id (> 0) and order_index.', code: 'VALIDATION_ERROR' });
    }
  }
  try {
    reorderTasks(req.body);
    res.json({ success: true, count: req.body.length });
  } catch (err) {
    logger.error({ err: err.message }, 'Reorder failed');
    res.status(500).json({ error: true, message: 'Failed to reorder tasks.', code: 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/tasks/reassign — Bulk reassign tasks between statuses.
 * Body: { from_status: string, to_status: string }
 */
router.put('/api/tasks/reassign', (req, res) => {
  const { from_status, to_status } = req.body;
  if (!from_status || !to_status) {
    return res.status(400).json({ error: true, message: 'from_status and to_status are required.', code: 'VALIDATION_ERROR' });
  }
  try {
    const count = bulkReassignTasks(from_status, to_status);
    res.json({ success: true, count });
  } catch (err) {
    const statusMap = { VALIDATION_ERROR: 400 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/tasks/:id — Update a task.
 */
router.put('/api/tasks/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    const task = updateTask(id, req.body);
    res.json(task);
  } catch (err) {
    logger.warn({ err: err.message, taskId: req.params.id }, 'Task update failed');
    const statusMap = { VALIDATION_ERROR: 400, TASK_NOT_FOUND: 404 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description DELETE /api/tasks/:id — Delete a task.
 */
router.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    deleteTask(id);
    res.status(204).send();
  } catch (err) {
    logger.warn({ err: err.message, taskId: req.params.id }, 'Task deletion failed');
    const statusMap = { VALIDATION_ERROR: 400, TASK_NOT_FOUND: 404 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

module.exports = router;
