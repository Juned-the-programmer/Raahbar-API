import { Bindings } from 'fastify/types/logger';
import { REDACTED_STRING } from './constants';

const ENV = process.env.NODE_ENV;
const LOG_LEVEL = 'info';

export function setupLogger(): object {
  return {
    requestIdLogLabel: 'reqId',
    disableRequestLogging: true,
    logger: {
      level: LOG_LEVEL,
      formatters: {
        level: (level: string) => ({ lvl: level }),
        log: transformer,
        bindings: (bindings: Bindings) => {
          delete bindings.pid;
          delete bindings.hostname;
          return { ...bindings };
        },
      },
      messageKey: 'msg',
      timestamp: () => `,"ts":"${formatLoggerDate(new Date())}"`,
      redact: {
        paths: ['*.authorization', '*.headers.authorization', '*.password'],
        censor: REDACTED_STRING,
      },
    },
  };
}

function transformer(log: object) {
  return removeEmptyKeys({ env: ENV, ...log });
}

export function removeEmptyKeys<T>(obj: T): T {
  const result: T = obj;
  for (const key in obj) {
    if (obj[key] === undefined || obj[key] === null) {
      delete result[key];
    }
  }
  return result;
}

export function formatLoggerDate(data: string | Date, toEndOfDay = false) {
  if (!data) return null;
  const date = new Date(data);
  if (toEndOfDay) {
    date.setUTCHours(0, 0, 0, 0);
  }
  return date.toISOString();
}
