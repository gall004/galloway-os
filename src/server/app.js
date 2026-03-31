const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./logger');
const healthRoutes = require('./routes/health.routes');
const taskRoutes = require('./routes/tasks.routes');
const configRoutes = require('./routes/config.routes');
const statusesRoutes = require('./routes/statuses.routes');
const metricsRoutes = require('./routes/metrics.routes');
const reportsRoutes = require('./routes/reports.routes');
const settingsRoutes = require('./routes/settings.routes');

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
  app.use(configRoutes);
  app.use(statusesRoutes);
  app.use(metricsRoutes);
  app.use(reportsRoutes);
  app.use(settingsRoutes);

  // Serve static assets from the React PWA build
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all route to serve the SPA for any unrecognized GET request
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/healthz')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

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
