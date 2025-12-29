// Custom service worker enhancement for "works after refresh" issues
// This script should be loaded before Angular's service worker

(function() {
  'use strict';

  // Inline logger for consistent format (matches LoggerService)
  var logger = {
    info: function(msg) { console.info('[INFO]: ' + msg); },
    warn: function(msg) { console.warn('[WARN]: ' + msg); },
    error: function(msg, err) { console.error('[ERROR]: ' + msg, err || ''); },
    log: function(msg) { console.log('[LOG]: ' + msg); }
  };

  if ('serviceWorker' in navigator) {
    // Enhanced service worker registration with better error handling
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/ngsw-worker.js')
        .then(function(registration) {
          logger.info('SW Enhancement - Service worker registered: ' + registration.scope);
          
          // Listen for updates
          registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            logger.info('SW Enhancement - New service worker installing...');
            
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  logger.info('SW Enhancement - New or updated content is available.');
                  
                  // Check if we should auto-refresh for critical updates
                  var shouldAutoRefresh = sessionStorage.getItem('sw_pending_refresh');
                  if (shouldAutoRefresh) {
                    sessionStorage.removeItem('sw_pending_refresh');
                    window.location.reload();
                  }
                } else {
                  // Content is cached for the first time
                  logger.info('SW Enhancement - Content is cached for offline use.');
                }
              }
            });
          });
        })
        .catch(function(registrationError) {
          logger.error('SW Enhancement - Service worker registration failed', registrationError);
          
          // If service worker registration fails, it might be causing our issues
          // Clear any existing registrations and caches
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
              registration.unregister().then(function() {
                logger.info('SW Enhancement - Cleared problematic service worker registration');
              });
            });
          });
          
          if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  return caches.delete(cacheName);
                })
              );
            }).then(function() {
              logger.info('SW Enhancement - Cleared all caches due to SW registration failure');
            });
          }
        });
    });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'CRITICAL_UPDATE') {
        // Mark that we need to refresh on next SW update
        sessionStorage.setItem('sw_pending_refresh', 'true');
      }
    });

    // Enhanced error handling for service worker issues
    navigator.serviceWorker.addEventListener('error', function(event) {
      logger.error('SW Enhancement - Service worker error', event);
      
      // If we get persistent SW errors, try to recover
      var errorCount = parseInt(sessionStorage.getItem('sw_error_count') || '0', 10);
      errorCount++;
      sessionStorage.setItem('sw_error_count', errorCount.toString());
      
      if (errorCount >= 3) {
        logger.warn('SW Enhancement - Multiple SW errors detected, attempting recovery...');
        sessionStorage.removeItem('sw_error_count');
        
        // Unregister and clear caches
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          return Promise.all(registrations.map(function(registration) {
            return registration.unregister();
          }));
        }).then(function() {
          return caches.keys();
        }).then(function(cacheNames) {
          return Promise.all(cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          }));
        }).then(function() {
          logger.info('SW Enhancement - SW recovery complete, reloading...');
          window.location.reload(true);
        }).catch(function(err) {
          logger.error('SW Enhancement - SW recovery failed', err);
        });
      }
    });
  }

  // Clear error count on successful loads
  window.addEventListener('load', function() {
    // Small delay to ensure everything is loaded
    setTimeout(function() {
      var appRoot = document.querySelector('app-root');
      if (appRoot && appRoot.children.length > 0) {
        sessionStorage.removeItem('sw_error_count');
        logger.info('SW Enhancement - App loaded successfully, cleared error count');
      }
    }, 2000);
  });
})();
