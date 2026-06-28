type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  organisationId?: string;
  userId?: string;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  duration?: number;
  status?: string;
  errorCode?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? "info"] ?? 1;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatLog(level: LogLevel, message: string, context: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  debug(message: string, context: LogContext = {}) {
    if (shouldLog("debug")) console.debug(formatLog("debug", message, context));
  },
  info(message: string, context: LogContext = {}) {
    if (shouldLog("info")) console.info(formatLog("info", message, context));
  },
  warn(message: string, context: LogContext = {}) {
    if (shouldLog("warn")) console.warn(formatLog("warn", message, context));
  },
  error(message: string, context: LogContext = {}) {
    if (shouldLog("error")) console.error(formatLog("error", message, context));
  },
};

export default logger;
