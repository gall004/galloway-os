const config = require('./config');
const logger = require('./logger');
const { createApp } = require('./app');
const { initializeDatabase } = require('./models/database');
const { runMigrations } = require('../db/migrate');
const { evaluateRecurringTasks } = require('./scheduler');
const cron = require('node-cron');

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
      logger.info({ port: config.port, env: config.nodeEnv }, 'focus-board server started');

      evaluateRecurringTasks();

      cron.schedule(config.recurringCron, () => {
        logger.info({ cron: config.recurringCron, tz: config.timezone }, 'Cron tick: evaluating recurring tasks');
        evaluateRecurringTasks();
      }, { timezone: config.timezone });

      logger.info({ cron: config.recurringCron, tz: config.timezone }, 'Recurring task cron scheduled');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();

