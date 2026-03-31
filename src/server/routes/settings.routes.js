const express = require('express');
const { getSettings, updateSettings } = require('../services/settings.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /api/settings — Retrieve app settings singleton.
 */
router.get('/api/settings', (_req, res) => {
  try {
    res.json(getSettings());
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to get settings');
    res.status(500).json({ error: true, message: err.message, code: 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/settings — Update app settings singleton.
 */
router.put('/api/settings', (req, res) => {
  try {
    res.json(updateSettings(req.body));
  } catch (err) {
    const status = err.code === 'VALIDATION_ERROR' ? 400 : 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

module.exports = router;
