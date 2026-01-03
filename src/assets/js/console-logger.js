/**
 * Lightweight console logger for non-Angular contexts
 * Provides consistent logging format matching LoggerService
 * Used by: Service Workers, Web Workers, inline scripts
 */
(function(global) {
  'use strict';

  const logger = {
    /**
     * Log informational messages
     */
    info: function(message, ...optionalParams) {
      console.info(`[INFO]: ${message}`, ...optionalParams);
    },

    /**
     * Log warning messages
     */
    warn: function(message, ...optionalParams) {
      console.warn(`[WARN]: ${message}`, ...optionalParams);
    },

    /**
     * Log error messages
     */
    error: function(message, ...optionalParams) {
      console.error(`[ERROR]: ${message}`, ...optionalParams);
    },

    /**
     * Log debug messages (only in development)
     */
    debug: function(message, ...optionalParams) {
      console.debug(`[DEBUG]: ${message}`, ...optionalParams);
    },

    /**
     * Log regular messages (use sparingly, prefer info/debug)
     */
    log: function(message, ...optionalParams) {
      console.log(`[LOG]: ${message}`, ...optionalParams);
    }
  };

  // Export for different contexts
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = logger;
  } else if (typeof self !== 'undefined') {
    // Web Worker/Service Worker context
    self.logger = logger;
  } else if (typeof window !== 'undefined') {
    // Browser global
    window.logger = logger;
  }

  // Also attach directly to global for maximum compatibility
  global.logger = logger;

})(typeof self !== 'undefined' ? self : this);
