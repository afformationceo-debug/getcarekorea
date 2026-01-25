/**
 * Structured Logging System
 *
 * Provides consistent, searchable, and analyzable logs
 * for error tracking, debugging, and monitoring.
 */

import { createAdminClient } from '@/lib/supabase/server';

// =====================================================
// TYPES
// =====================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  // Request context
  requestId?: string;
  sessionId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;

  // Operation context
  operation?: string;
  component?: string;
  module?: string;

  // Business context
  keywordId?: string;
  blogPostId?: string;
  locale?: string;

  // Performance
  durationMs?: number;

  // Additional metadata
  [key: string]: unknown;
}

export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  tags?: string[];
}

export interface LogFilter {
  level?: LogLevel | LogLevel[];
  startDate?: Date;
  endDate?: Date;
  component?: string;
  operation?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// =====================================================
// CONFIGURATION
// =====================================================

const LOG_CONFIG = {
  // Minimum level to log (debug < info < warn < error < fatal)
  minLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,

  // Whether to persist logs to database
  persistToDB: process.env.NODE_ENV === 'production',

  // Whether to send critical logs to external services
  sendAlerts: process.env.NODE_ENV === 'production',

  // Console output formatting
  prettyPrint: process.env.NODE_ENV !== 'production',

  // Maximum log message length
  maxMessageLength: 10000,

  // Fields to redact from logs
  sensitiveFields: [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'credit_card',
    'ssn',
  ],
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// =====================================================
// LOGGER CLASS
// =====================================================

class StructuredLogger {
  private static instance: StructuredLogger;
  private requestContext: LogContext = {};

  private constructor() {}

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  /**
   * Set context for all subsequent logs in this request
   */
  setRequestContext(context: LogContext): void {
    this.requestContext = { ...this.requestContext, ...context };
  }

  /**
   * Clear request context (call at end of request)
   */
  clearRequestContext(): void {
    this.requestContext = {};
  }

  /**
   * Main logging method
   */
  async log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): Promise<void> {
    // Check if this level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[LOG_CONFIG.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.truncateMessage(message),
      context: this.redactSensitiveData({
        ...this.requestContext,
        ...context,
      }),
      tags: this.generateTags(level, context),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      };
    }

    // Console output
    this.outputToConsole(entry);

    // Persist to database for production
    if (LOG_CONFIG.persistToDB) {
      await this.persistLog(entry);
    }

    // Send alerts for critical errors
    if (LOG_CONFIG.sendAlerts && (level === 'error' || level === 'fatal')) {
      await this.sendAlert(entry);
    }
  }

  // Convenience methods
  debug(message: string, context?: LogContext): Promise<void> {
    return this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): Promise<void> {
    return this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): Promise<void> {
    return this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): Promise<void> {
    return this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): Promise<void> {
    return this.log('fatal', message, context, error);
  }

  /**
   * Log API call with timing
   */
  async logAPICall(
    provider: string,
    endpoint: string,
    startTime: number,
    success: boolean,
    context?: LogContext
  ): Promise<void> {
    const durationMs = Date.now() - startTime;
    const level: LogLevel = success ? 'info' : 'error';

    await this.log(level, `API call to ${provider}/${endpoint}`, {
      ...context,
      operation: 'api_call',
      component: 'external_api',
      durationMs,
      provider,
      endpoint,
      success,
    });
  }

  /**
   * Log content generation step
   */
  async logContentGeneration(
    step: string,
    keywordId: string,
    success: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    const level: LogLevel = success ? 'info' : 'error';

    await this.log(level, `Content generation: ${step}`, {
      operation: 'content_generation',
      component: 'content_pipeline',
      keywordId,
      step,
      success,
      ...details,
    });
  }

  /**
   * Log cron job execution
   */
  async logCronJob(
    jobName: string,
    startTime: number,
    success: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    const durationMs = Date.now() - startTime;
    const level: LogLevel = success ? 'info' : 'error';

    await this.log(level, `Cron job: ${jobName} ${success ? 'completed' : 'failed'}`, {
      operation: 'cron_job',
      component: 'scheduler',
      jobName,
      durationMs,
      success,
      ...details,
    });
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private truncateMessage(message: string): string {
    if (message.length <= LOG_CONFIG.maxMessageLength) {
      return message;
    }
    return message.slice(0, LOG_CONFIG.maxMessageLength) + '... (truncated)';
  }

  private redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (LOG_CONFIG.sensitiveFields.some(field => lowerKey.includes(field))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  private generateTags(level: LogLevel, context?: LogContext): string[] {
    const tags: string[] = [level];

    if (context?.component) tags.push(`component:${context.component}`);
    if (context?.operation) tags.push(`operation:${context.operation}`);
    if (context?.locale) tags.push(`locale:${context.locale}`);

    return tags;
  }

  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;

    if (LOG_CONFIG.prettyPrint) {
      // Pretty format for development
      const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        fatal: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';

      console.log(
        `${levelColors[level]}[${level.toUpperCase()}]${reset} ${timestamp} ${message}`
      );

      if (Object.keys(context).length > 0) {
        console.log('  Context:', JSON.stringify(context, null, 2));
      }

      if (error) {
        console.log('  Error:', error.message);
        if (error.stack) {
          console.log('  Stack:', error.stack);
        }
      }
    } else {
      // JSON format for production
      console.log(JSON.stringify(entry));
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      const supabase = await createAdminClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('application_logs') as any).insert({
        level: entry.level,
        message: entry.message,
        context: entry.context,
        error: entry.error,
        tags: entry.tags,
        created_at: entry.timestamp,
      });
    } catch (err) {
      // Don't throw - logging failures shouldn't break the app
      console.error('Failed to persist log:', err);
    }
  }

  private async sendAlert(entry: LogEntry): Promise<void> {
    try {
      // Send to Slack
      const slackWebhook = process.env.SLACK_WEBHOOK_URL;
      if (slackWebhook) {
        const emoji = entry.level === 'fatal' ? '🚨' : '⚠️';
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `${emoji} *${entry.level.toUpperCase()}* - ${entry.message}`,
            attachments: [
              {
                color: entry.level === 'fatal' ? '#FF0000' : '#FFA500',
                fields: [
                  {
                    title: 'Component',
                    value: entry.context.component || 'Unknown',
                    short: true,
                  },
                  {
                    title: 'Operation',
                    value: entry.context.operation || 'Unknown',
                    short: true,
                  },
                  {
                    title: 'Error',
                    value: entry.error?.message || 'No error details',
                    short: false,
                  },
                ],
                ts: Math.floor(Date.parse(entry.timestamp) / 1000).toString(),
              },
            ],
          }),
        }).catch(() => {});
      }
    } catch {
      // Silently fail - don't let alert failures affect the application
    }
  }
}

// =====================================================
// EXPORTS
// =====================================================

export const logger = StructuredLogger.getInstance();

// Helper function for creating request-scoped loggers
export function createRequestLogger(requestId: string, context?: LogContext) {
  const requestLogger = StructuredLogger.getInstance();
  requestLogger.setRequestContext({
    requestId,
    ...context,
  });
  return requestLogger;
}

// Middleware helper for Next.js API routes
export function withLogging<T>(
  handler: (req: Request) => Promise<T>,
  operationName: string
) {
  return async (req: Request): Promise<T> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    logger.setRequestContext({
      requestId,
      operation: operationName,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    try {
      const result = await handler(req);

      await logger.info(`${operationName} completed`, {
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      await logger.error(
        `${operationName} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: Date.now() - startTime }
      );
      throw error;
    } finally {
      logger.clearRequestContext();
    }
  };
}

// Log query helper
export async function queryLogs(filter: LogFilter): Promise<LogEntry[]> {
  try {
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('application_logs') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.level) {
      if (Array.isArray(filter.level)) {
        query = query.in('level', filter.level);
      } else {
        query = query.eq('level', filter.level);
      }
    }

    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate.toISOString());
    }

    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate.toISOString());
    }

    if (filter.component) {
      query = query.contains('context', { component: filter.component });
    }

    if (filter.operation) {
      query = query.contains('context', { operation: filter.operation });
    }

    if (filter.search) {
      query = query.ilike('message', `%${filter.search}%`);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((log: {
      id: string;
      level: LogLevel;
      message: string;
      context: LogContext;
      error?: LogEntry['error'];
      tags?: string[];
      created_at: string;
    }) => ({
      id: log.id,
      timestamp: log.created_at,
      level: log.level,
      message: log.message,
      context: log.context,
      error: log.error,
      tags: log.tags,
    }));
  } catch (error) {
    console.error('Failed to query logs:', error);
    return [];
  }
}
