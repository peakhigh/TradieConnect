/**
 * Secure logging utility that sanitizes user input to prevent log injection attacks
 * This utility should be used throughout the app for all logging operations
 */

/**
 * Sanitizes user input before logging to prevent log injection attacks
 * Removes or encodes potentially dangerous characters like newlines, carriage returns, etc.
 */
export const sanitizeForLog = (input: any): string => {
  if (input === null || input === undefined) {
    return 'null';
  }
  
  const str = String(input);
  
  // Remove or encode dangerous characters that could be used for log injection
  return str
    .replace(/\r\n/g, '\\r\\n')  // Replace CRLF with escaped version
    .replace(/\r/g, '\\r')       // Replace CR with escaped version
    .replace(/\n/g, '\\n')       // Replace LF with escaped version
    .replace(/\t/g, '\\t')       // Replace tab with escaped version
    .replace(/\x00/g, '\\x00')   // Replace null byte
    .replace(/\x1b/g, '\\x1b')   // Replace escape character
    .substring(0, 1000);         // Limit length to prevent log flooding
};

/**
 * Secure console.log wrapper that sanitizes all inputs
 */
export const secureLog = (...args: any[]): void => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return sanitizeForLog(JSON.stringify(arg));
      } catch {
        return sanitizeForLog(String(arg));
      }
    }
    return sanitizeForLog(arg);
  });
  
  console.log(...sanitizedArgs);
};

/**
 * Secure console.error wrapper that sanitizes all inputs
 */
export const secureError = (...args: any[]): void => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return sanitizeForLog(JSON.stringify(arg));
      } catch {
        return sanitizeForLog(String(arg));
      }
    }
    return sanitizeForLog(arg);
  });
  
  console.error(...sanitizedArgs);
};

/**
 * Secure console.warn wrapper that sanitizes all inputs
 */
export const secureWarn = (...args: any[]): void => {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return sanitizeForLog(JSON.stringify(arg));
      } catch {
        return sanitizeForLog(String(arg));
      }
    }
    return sanitizeForLog(arg);
  });
  
  console.warn(...sanitizedArgs);
};

/**
 * Logger class for structured logging with automatic sanitization
 */
export class SecureLogger {
  private context: string;

  constructor(context: string) {
    this.context = sanitizeForLog(context);
  }

  info(message: string, data?: any): void {
    const sanitizedMessage = sanitizeForLog(message);
    if (data) {
      const sanitizedData = sanitizeForLog(JSON.stringify(data));
      console.log(`[${this.context}] INFO: ${sanitizedMessage}`, sanitizedData);
    } else {
      console.log(`[${this.context}] INFO: ${sanitizedMessage}`);
    }
  }

  error(message: string, error?: any): void {
    const sanitizedMessage = sanitizeForLog(message);
    if (error) {
      const sanitizedError = sanitizeForLog(error instanceof Error ? error.message : String(error));
      console.error(`[${this.context}] ERROR: ${sanitizedMessage}`, sanitizedError);
    } else {
      console.error(`[${this.context}] ERROR: ${sanitizedMessage}`);
    }
  }

  warn(message: string, data?: any): void {
    const sanitizedMessage = sanitizeForLog(message);
    if (data) {
      const sanitizedData = sanitizeForLog(JSON.stringify(data));
      console.warn(`[${this.context}] WARN: ${sanitizedMessage}`, sanitizedData);
    } else {
      console.warn(`[${this.context}] WARN: ${sanitizedMessage}`);
    }
  }

  debug(message: string, data?: any): void {
    if (__DEV__) {
      const sanitizedMessage = sanitizeForLog(message);
      if (data) {
        const sanitizedData = sanitizeForLog(JSON.stringify(data));
        console.log(`[${this.context}] DEBUG: ${sanitizedMessage}`, sanitizedData);
      } else {
        console.log(`[${this.context}] DEBUG: ${sanitizedMessage}`);
      }
    }
  }
}

// Default logger instance
export const logger = new SecureLogger('TradieConnect');

// Export individual methods for convenience
export const { info, error, warn, debug } = logger;