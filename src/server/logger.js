const pino = require('pino');
const config = require('./config');

/**
 * @description Application-wide structured logger instance.
 * Uses Pino for high-performance JSON logging.
 * In development, pipes through pino-pretty for readability.
 */
const logger = pino({
  level: config.logLevel,
  ...(config.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});

module.exports = logger;
