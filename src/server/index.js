const config = require('./config');
const logger = require('./logger');
const { createApp } = require('./app');
const { initializeDatabase } = require('./models/database');
const { runMigrations } = require('../db/migrate');

/**
 * @description Server entry point.
 * Initializes the database, runs migrations, and starts the Express server.
 */
async function main() {
  try {
    initializeDatabase();
    runMigrations();

    const app = createApp();

    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'galloway-os server started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
