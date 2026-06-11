/**
 * 🥋 SYSBJJ 2.0 - PROFESSIONAL LOGGER SERVICE
 * Silences debug, retry, bootstrap, and api noise in production environment.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  }
};

