// Custom service worker enhancement for "works after refresh" issues
// This script should be loaded before Angular's service worker

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    // Enhanced service worker registration with better error handling
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/ngsw-worker.js')
        .then(function(registration) {
          console.log('SW registered: ', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            console.log('New service worker installing...');
            
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New or updated content is available.');
                  
                  // Check if we should auto-refresh for critical updates
                  var shouldAutoRefresh = sessionStorage.getItem('sw_pending_refresh');
                  if (shouldAutoRefresh) {
                    sessionStorage.removeItem('sw_pending_refresh');
                    window.location.reload();
                  }
                } else {
                  // Content is cached for the first time
                  console.log('Content is cached for offline use.');
                }
              }
            });
          });
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
          
          // If service worker registration fails, it might be causing our issues
          // Clear any existing registrations and caches
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
              registration.unregister().then(function() {
                console.log('Cleared problematic service worker registration');
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
              console.log('Cleared all caches due to SW registration failure');
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
      console.error('Service Worker error:', event);
      
      // If we get persistent SW errors, try to recover
      var errorCount = parseInt(sessionStorage.getItem('sw_error_count') || '0', 10);
      errorCount++;
      sessionStorage.setItem('sw_error_count', errorCount.toString());
      
      if (errorCount >= 3) {
        console.log('Multiple SW errors detected, attempting recovery...');
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
          console.log('SW recovery complete, reloading...');
          window.location.reload(true);
        }).catch(function(err) {
          console.error('SW recovery failed:', err);
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
        console.log('App loaded successfully, cleared error count');
      }
    }, 2000);
  });
})();
