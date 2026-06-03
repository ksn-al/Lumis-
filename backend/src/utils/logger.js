const { createLogger, format, transports } = require('winston');

// Console-only logging — no file transport.
// Render (and most PaaS) use ephemeral filesystems; writing log files there
// wastes disk quota and gets wiped on every deploy. All output goes to stdout
// where the platform captures it.
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.simple()
  ),
  transports: [
    new transports.Console(),
  ]
});

module.exports = logger;
