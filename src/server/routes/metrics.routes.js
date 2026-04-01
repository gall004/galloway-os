const express = require('express');
const { getMetrics } = require('../services/metrics.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /api/metrics — returns aggregated dashboard metrics.
 */
router.get('/api/metrics', (req, res, next) => {
  try {
    const { timeframe } = req.query;
    const metrics = getMetrics(timeframe);
    res.json(metrics);
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to compute metrics');
    next(err);
  }
});

module.exports = router;
