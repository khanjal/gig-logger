// Simple Web Worker for polling
let pollingInterval = null;
let intervalMs = 30000; // Default 30 seconds

// Listen for messages from main thread
self.onmessage = function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_POLLING':
      startPolling(data?.interval || intervalMs);
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

function startPolling(interval) {
  console.log('[Polling Worker] Starting polling with interval:', interval);
  intervalMs = interval;
  
  // Clear any existing interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Start new interval
  pollingInterval = setInterval(() => {
    // Send poll trigger message to main thread
    self.postMessage({
      type: 'POLL_TRIGGER',
      timestamp: Date.now()
    });
  }, intervalMs);
  
  // Send confirmation
  self.postMessage({
    type: 'POLLING_STARTED',
    interval: intervalMs
  });
}

function stopPolling() {
  console.log('[Polling Worker] Stopping polling');
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
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
