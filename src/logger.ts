import { createLogger, transports, format } from 'winston';

export default createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
  ),
  defaultMeta: { service: 'reddit-assistant' },
  transports: [
    new transports.Console(),
    new transports.File({ filename: `./logs/error/logs error ${new Date()}.log`, level: 'error' }),
    new transports.File({ filename: `./logs/logs ${new Date()}.log` }),
  ],
})