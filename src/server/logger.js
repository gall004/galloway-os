const fs = require('fs');
const pino = require('pino');
const config = require('./config');

// Ensure log directory exists
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

/**
 * @description Build Pino transport targets for dual-destination logging.
 * - stdout: pino-pretty (dev) or raw JSON (prod) for real-time observation.
 * - file: pino-roll for daily-rotated persistent logs with automatic retention.
 * @returns {Object} Pino transport configuration.
 */
function buildTransport() {
  if (config.nodeEnv === 'test') {
    return { target: 'pino/file', options: { destination: '/dev/null' } };
  }
  const fileTarget = {
    target: 'pino-roll',
    options: {
      file: `${config.logDir}/app`,
      frequency: 'daily',
      dateFormat: 'yyyy-MM-dd',
      limit: { count: config.logRetentionDays },
    },
    level: config.logLevel,
  };

  const stdoutTarget = config.nodeEnv === 'development'
    ? { target: 'pino-pretty', options: { colorize: true }, level: config.logLevel }
    : { target: 'pino/file', options: { destination: 1 }, level: config.logLevel };

  return { targets: [stdoutTarget, fileTarget] };
}

/**
 * @description Application-wide structured logger instance.
 * Writes to both stdout and daily-rotated log files.
 * Retention is controlled by LOG_RETENTION_DAYS (default: 14 days).
 */
const logger = pino({
  level: config.logLevel,
  transport: buildTransport(),
});

module.exports = logger;
