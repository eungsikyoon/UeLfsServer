// ----------------------------------------------------------------------------
// © 2022 Eungsik Yoon <yoon.eungsik@gmail.com>
// ----------------------------------------------------------------------------

import config from 'config';
import { createLogger, format, Logger, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// ----------------------------------------------------------------------------
function loggerFactory(filename: string, savedir: string) {
  const logger = createLogger({
    transports: [
      new transports.Console({
        level: config.get('log.console.level'),
        handleExceptions: false,
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.timestamp()
        ),
      }),
      new DailyRotateFile({
        dirname: savedir,
        filename: filename,
        level: config.get('log.file.level') || 'info',
        handleExceptions: false,
        datePattern: config.get('log.file.datePattern') || 'YYYY-MM-DD-HH',
        format: format.combine(format.timestamp(), format.json()),
      }),
    ],
  });

  return logger;
}

// ----------------------------------------------------------------------------
const logger = loggerFactory('uelfsd', './log');
export default logger;
