const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const healthRoutes = require('./routes/health.routes');
const taskRoutes = require('./routes/tasks.routes');

/**
 * @description Create and configure the Express application.
 * Separated from the server listener to enable testability with Supertest.
 * @returns {express.Application} The configured Express app.
 */
function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(healthRoutes);
  app.use(taskRoutes);
  app.use((err, _req, res, _next) => {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  return app;
}

module.exports = { createApp };
