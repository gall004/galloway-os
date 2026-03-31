const path = require('path');

/**
 * @description Centralized application configuration.
 * All environment variables are read here with sane defaults.
 * No other file should read process.env directly.
 */
const config = {
  /** @type {number} Express server port */
  port: parseInt(process.env.PORT, 10) || 3000,

  /** @type {string} Node environment */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** @type {string} Absolute path to the SQLite database file */
  databasePath: path.resolve(__dirname, '../db', process.env.DB_FILE || 'dev.sqlite'),

  /** @type {string} Log level for Pino logger */
  logLevel: process.env.LOG_LEVEL || 'info',

  /** @type {string} IANA timezone for the recurring task scheduler (e.g., 'America/Chicago') */
  timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,

  /** @type {string} Cron expression for recurring task evaluation (default: 5:00 AM daily) */
  recurringCron: process.env.RECURRING_CRON || '0 5 * * *',
};

module.exports = config;
