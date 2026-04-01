const express = require('express');
const { createConfigService } = require('../services/config.service');
const logger = require('../logger');

const router = express.Router();

const ENTITIES = [
  { path: 'boards', table: 'boards' },
  { path: 'customers', table: 'customers' },
  { path: 'projects', table: 'projects', hasCustomerFK: true, hasBoardFK: true },
];

/**
 * @description Register CRUD routes for a config entity.
 * @param {{ path: string, table: string, hasCustomerFK?: boolean, hasBoardFK?: boolean }} entity
 */
function registerEntityRoutes(entity) {
  const svc = createConfigService(entity.table, entity.hasCustomerFK, entity.hasBoardFK);

  router.get(`/api/${entity.path}`, (req, res) => {
    try { res.json(svc.getAll(req.query.board_id)); }
    catch (err) { logger.error({ err: err.message }, `Failed to get ${entity.path}`); res.status(500).json({ error: true, message: err.message, code: 'INTERNAL_ERROR' }); }
  });

  router.post(`/api/${entity.path}`, (req, res) => {
    if (!req.body?.name || typeof req.body.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: true, message: 'Name is required.', code: 'VALIDATION_ERROR' });
    }
    const payload = { ...req.body };
    if (req.query.board_id && !payload.board_id) { payload.board_id = req.query.board_id; }
    try { res.status(201).json(svc.create(payload)); }
    catch (err) {
      logger.warn({ err: err.message }, `${entity.path} creation failed`);
      const status = err.message?.includes('UNIQUE') ? 409 : 500;
      res.status(status).json({ error: true, message: err.message, code: status === 409 ? 'DUPLICATE' : 'INTERNAL_ERROR' });
    }
  });

  router.put(`/api/${entity.path}/:id`, (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: true, message: 'Invalid ID.', code: 'VALIDATION_ERROR' });
      }
      if (id === 1) {
        return res.status(403).json({ error: true, message: 'Cannot edit the default system entity.', code: 'FORBIDDEN' });
      }
      res.json(svc.update(id, req.body));
    } catch (err) {
      const status = err.code === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
    }
  });

  router.delete(`/api/${entity.path}/:id`, (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: true, message: 'Invalid ID.', code: 'VALIDATION_ERROR' });
      }
      if (id === 1) {
        return res.status(403).json({ error: true, message: 'Cannot delete the default system entity.', code: 'FORBIDDEN' });
      }
      svc.remove(id);
      res.status(204).send();
    } catch (err) {
      const statusMap = { NOT_FOUND: 404, FK_CONSTRAINT: 409 };
      const status = statusMap[err.code] || 500;
      res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
    }
  });
}

ENTITIES.forEach(registerEntityRoutes);

module.exports = router;
