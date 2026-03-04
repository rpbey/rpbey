import { addLog } from './api-server.js';
import { logger } from './logger.js';

// Wrap the logger to capture logs
export function setupLogCapture() {
  // Create proxy for each log level
  const levels = ['info', 'warn', 'error', 'debug'] as const;

  for (const level of levels) {
    const originalMethod = logger[level];

    // Override the static method
    logger[level] = (...args: unknown[]) => {
      // Call original method
      originalMethod(...args);

      // Capture the log
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
        )
        .join(' ');

      addLog(level.toUpperCase(), message);
    };
  }
}
