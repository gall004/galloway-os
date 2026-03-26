const { isDatabaseHealthy } = require('../models/database');

/**
 * @description Health check service.
 * Verifies database connectivity and returns health status.
 * @returns {{ status: string, database: string }} Health status object.
 */
function checkHealth() {
  const dbHealthy = isDatabaseHealthy();

  return {
    status: dbHealthy ? 'ok' : 'degraded',
    database: dbHealthy ? 'connected' : 'unreachable',
  };
}

module.exports = { checkHealth };
