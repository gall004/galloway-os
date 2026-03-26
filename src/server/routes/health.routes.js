const express = require('express');
const { checkHealth } = require('../services/health.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description GET /healthz — Health check endpoint.
 * Verifies database connectivity and returns service health status.
 * Returns 200 if healthy, 503 if degraded.
 */
router.get('/healthz', (req, res) => {
  const health = checkHealth();
  const statusCode = health.status === 'ok' ? 200 : 503;

  logger.info({ health }, 'Health check requested');
  res.status(statusCode).json(health);
});

module.exports = router;
