const express = require('express');
const { getAllStatuses, getStatus, updateStatusLabel } = require('../services/statuses.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /api/statuses — List all statuses.
 */
router.get('/api/statuses', (_req, res) => {
  try { res.json(getAllStatuses()); }
  catch (err) {
    logger.error({ err: err.message }, 'Failed to get statuses');
    res.status(500).json({ error: true, message: err.message, code: 'INTERNAL_ERROR' });
  }
});

/**
 * @description GET /api/statuses/:name — Get a single status by name.
 */
router.get('/api/statuses/:name', (req, res) => {
  try { res.json(getStatus(req.params.name)); }
  catch (err) {
    const status = err.code === 'NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/statuses/:name — Update label only. Name is immutable.
 */
router.put('/api/statuses/:name', (req, res) => {
  try { res.json(updateStatusLabel(req.params.name, req.body)); }
  catch (err) {
    const statusMap = { NOT_FOUND: 404, VALIDATION_ERROR: 400 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description POST /api/statuses — 405 Method Not Allowed.
 */
router.post('/api/statuses', (_req, res) => {
  res.status(405).json({ error: true, message: 'Statuses cannot be created. They are system-defined.', code: 'METHOD_NOT_ALLOWED' });
});

/**
 * @description DELETE /api/statuses/:name — 405 Method Not Allowed.
 */
router.delete('/api/statuses/:name', (_req, res) => {
  res.status(405).json({ error: true, message: 'Statuses cannot be deleted. They are system-defined.', code: 'METHOD_NOT_ALLOWED' });
});

module.exports = router;
