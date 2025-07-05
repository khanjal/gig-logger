// Simple Web Worker for polling
let pollingInterval = null;
let intervalMs = 60000; // Default 60 seconds
let initialDelayTimeout = null; // Store the timeout ID for initial delay

// Listen for messages from main thread
self.onmessage = function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_POLLING':
      startPolling(data?.interval || intervalMs, data?.initialDelay || 0);
      break;
    case 'STOP_POLLING':
      stopPolling();
      break;
    case 'SET_INTERVAL':
      intervalMs = data?.interval || intervalMs;
      break;
    default:
      console.warn('[Polling Worker] Unknown message type:', type);
  }
};

function startPolling(interval, initialDelay = 0) {
  console.log('[Polling Worker] Starting polling with interval:', interval, 'initial delay:', initialDelay);
  intervalMs = interval;
  
  // Clear any existing interval or timeout
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (initialDelayTimeout) {
    clearTimeout(initialDelayTimeout);
    initialDelayTimeout = null;
  }
  
  const startRegularPolling = () => {
    pollingInterval = setInterval(() => {
      // Send poll trigger message to main thread
      self.postMessage({
        type: 'POLL_TRIGGER',
        timestamp: Date.now()
      });
    }, intervalMs);
  };
  
  if (initialDelay > 0) {
    // Start with initial delay, then begin regular polling
    initialDelayTimeout = setTimeout(() => {
      // Send the first poll trigger after initial delay
      self.postMessage({
        type: 'POLL_TRIGGER',
        timestamp: Date.now()
      });
      // Start regular polling
      startRegularPolling();
      initialDelayTimeout = null;
    }, initialDelay);
  } else {
    // Start regular polling immediately
    startRegularPolling();
  }
  
  // Send confirmation
  self.postMessage({
    type: 'POLLING_STARTED',
    interval: intervalMs,
    initialDelay: initialDelay
  });
}

function stopPolling() {
  console.log('[Polling Worker] Stopping polling');
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (initialDelayTimeout) {
    clearTimeout(initialDelayTimeout);
    initialDelayTimeout = null;
  }
  
  // Send confirmation
  self.postMessage({
    type: 'POLLING_STOPPED'
  });
}

// Send ready message
self.postMessage({
  type: 'WORKER_READY'
});
