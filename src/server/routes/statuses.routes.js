const express = require('express');
const { getAllStatuses, getStatus, createStatus, updateStatusLabel, deleteStatus } = require('../services/statuses.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /api/statuses — List all statuses with governance metadata.
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
 * @description POST /api/statuses — Create a custom status column.
 */
router.post('/api/statuses', (req, res) => {
  try {
    res.status(201).json(createStatus(req.body));
  } catch (err) {
    const statusMap = { VALIDATION_ERROR: 400 };
    const status = statusMap[err.code] || (err.message?.includes('UNIQUE') ? 409 : 500);
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/statuses/:name — Update label only. Respects is_renamable governance.
 */
router.put('/api/statuses/:name', (req, res) => {
  try { res.json(updateStatusLabel(req.params.name, req.body)); }
  catch (err) {
    const statusMap = { NOT_FOUND: 404, VALIDATION_ERROR: 400, FORBIDDEN: 403 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description DELETE /api/statuses/:name — Safe delete with task reassignment.
 * Body: { fallback_status_name: string } (required if tasks exist in the status).
 */
router.delete('/api/statuses/:name', (req, res) => {
  try {
    deleteStatus(req.params.name, req.body?.fallback_status_name);
    res.status(204).send();
  } catch (err) {
    const statusMap = { NOT_FOUND: 404, FORBIDDEN: 403, VALIDATION_ERROR: 400 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

module.exports = router;
