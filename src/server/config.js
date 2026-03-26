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
  databasePath: path.resolve(process.env.DATABASE_PATH || './data/galloway-os.sqlite'),

  /** @type {string} Log level for Pino logger */
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
