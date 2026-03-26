const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../server/models/database');
const logger = require('../server/logger');

/**
 * @description Run all pending database migrations in order.
 * Creates a migrations tracking table if it doesn't exist.
 * Migrations are idempotent — already-applied migrations are skipped.
 */
function runMigrations() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const applied = db.prepare('SELECT name FROM _migrations').all().map((r) => r.name);

  for (const file of files) {
    if (applied.includes(file)) {
      logger.debug({ migration: file }, 'Migration already applied, skipping');
      continue;
    }

    const migration = require(path.join(migrationsDir, file));
    db.exec(migration.up);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
    logger.info({ migration: file }, 'Migration applied');
  }
}

module.exports = { runMigrations };
