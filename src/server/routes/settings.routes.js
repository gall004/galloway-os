const express = require('express');
const { getSettings, updateSettings } = require('../services/settings.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /api/settings — Retrieve app settings singleton.
 */
router.get('/api/settings', (req, res, next) => {
  try {
    const boardId = req.query.board_id ? parseInt(req.query.board_id, 10) : 1;
    res.json(getSettings(boardId));
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to get settings');
    next(err);
  }
});

/**
 * @description PUT /api/settings — Update app settings singleton.
 */
router.put('/api/settings', (req, res) => {
  try {
    const boardId = req.query.board_id ? parseInt(req.query.board_id, 10) : 1;
    res.json(updateSettings(req.body, boardId));
  } catch (err) {
    const status = err.code === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

module.exports = router;
