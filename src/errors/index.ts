/**
 * Custom error classes for better error handling and context
 */

/**
 * Base error class for all Scry errors
 */
export class ScryError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public override readonly cause?: Error;

  constructor(message: string, code: string, context?: Record<string, unknown>, cause?: Error) {
    super(message);
    this.name = 'ScryError';
    this.code = code;
    this.context = context;
    this.cause = cause;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get detailed error information
   */
  toDetailedString(): string {
    let output = `${this.name} [${this.code}]: ${this.message}\n`;

    if (this.context && Object.keys(this.context).length > 0) {
      output += '\nContext:\n';
      for (const [key, value] of Object.entries(this.context)) {
        output += `  ${key}: ${JSON.stringify(value)}\n`;
      }
    }

    if (this.stack) {
      output += `\nStack trace:\n${this.stack}\n`;
    }

    if (this.cause) {
      output += `\nCaused by: ${this.cause.message}\n`;
      if (this.cause.stack) {
        output += `${this.cause.stack}\n`;
      }
    }

    return output;
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends ScryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'CONFIG_ERROR', context, cause);
    this.name = 'ConfigError';
  }
}

/**
 * File scanning errors
 */
export class ScanError extends ScryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'SCAN_ERROR', context, cause);
    this.name = 'ScanError';
  }
}

/**
 * File read/access errors
 */
export class FileError extends ScryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'FILE_ERROR', context, cause);
    this.name = 'FileError';
  }
}

/**
 * Rule execution errors
 */
export class RuleError extends ScryError {
  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message, 'RULE_ERROR', context, cause);
    this.name = 'RuleError';
  }
}

/**
 * Format and display error for CLI
 */
export function formatError(error: unknown, verbose: boolean = false): string {
  if (error instanceof ScryError) {
    if (verbose) {
      return error.toDetailedString();
    }

    let output = `${error.name}: ${error.message}`;

    if (error.context) {
      const contextKeys = Object.keys(error.context);
      if (contextKeys.length > 0) {
        output += '\n\n';
        for (const key of contextKeys) {
          const value = error.context[key];
          if (typeof value === 'string' && value.length < 100) {
            output += `  ${key}: ${value}\n`;
          }
        }
      }
    }

    return output;
  }

  if (error instanceof Error) {
    if (verbose) {
      let output = `Error: ${error.message}\n`;
      if (error.stack) {
        output += `\n${error.stack}`;
      }
      return output;
    }
    return `Error: ${error.message}`;
  }

  return `Unknown error: ${String(error)}`;
}

/**
 * Wrap an error with additional context
 */
export function wrapError(
  error: unknown,
  message: string,
  context?: Record<string, unknown>
): ScryError {
  const cause = error instanceof Error ? error : new Error(String(error));
  return new ScryError(message, 'WRAPPED_ERROR', context, cause);
}
