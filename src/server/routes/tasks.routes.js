const express = require('express');
const { createTask, getAllTasks, updateTask, deleteTask } = require('../services/tasks.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description Parse and validate a numeric ID parameter.
 * @param {string} rawId - The raw ID string from URL params.
 * @returns {number} The parsed integer ID.
 * @throws {Error} If the ID is not a valid positive integer.
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
  if (!req.body || !req.body.title || typeof req.body.title !== 'string' || req.body.title.trim() === '') {
    return res.status(400).json({ error: true, message: 'Title is required and must be a non-empty string.', code: 'VALIDATION_ERROR' });
  }

  try {
    const task = createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    logger.warn({ err: err.message }, 'Task creation failed');
    const status = err.code === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description GET /api/tasks — Retrieve all tasks.
 */
router.get('/api/tasks', (_req, res) => {
  try {
    const tasks = getAllTasks();
    res.json(tasks);
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to retrieve tasks');
    res.status(500).json({ error: true, message: 'Failed to retrieve tasks.', code: 'INTERNAL_ERROR' });
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
