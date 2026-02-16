export class Logger {
  public static info(...args: unknown[]) {
    console.info(...args);
  }

  public static warn(...args: unknown[]) {
    console.warn(...args);
  }

  public static error(...args: unknown[]) {
    console.error(...args);
  }

  public static debug(...args: unknown[]) {
    // Only log debug in development or if verbose
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  }

  public static trace(...args: unknown[]) {
    if (process.env.NODE_ENV === 'development') {
      console.trace(...args);
    }
  }

  public static fatal(...args: unknown[]) {
    console.error('[FATAL]', ...args);
  }
}

export const logger = Logger;
