const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../logger');

let db = null;

/**
 * @description Initialize the SQLite database connection.
 * Creates the data directory if it doesn't exist.
 * Sets WAL journal mode and busy timeout for concurrency.
 * @returns {import('better-sqlite3').Database} The database instance.
 */
function initializeDatabase() {
  const isMemory = config.databasePath === ':memory:';

  if (!isMemory) {
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  db = new Database(config.databasePath);

  if (!isMemory) {
    db.pragma('journal_mode = WAL');
  }

  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  logger.info({ path: config.databasePath }, 'SQLite database connected');
  return db;
}

/**
 * @description Get the current database instance.
 * @returns {import('better-sqlite3').Database} The database instance.
 * @throws {Error} If database has not been initialized.
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * @description Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('SQLite database connection closed');
  }
}

/**
 * @description Check if the database connection is alive.
 * @returns {boolean} True if the database is reachable.
 */
function isDatabaseHealthy() {
  try {
    if (!db) {
      return false;
    }
    const result = db.prepare('SELECT 1 AS ok').get();
    return result && result.ok === 1;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  isDatabaseHealthy,
};
