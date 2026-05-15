// Simple client-side environment bridge (optional).
// If you run the frontend static server with env variables injected, put a script that sets window.__env.
(function(){
  // Default to already configured values
  // window.__env = window.__env || {};
  // Example: set API_BASE via docker or static inject
  window.__env.API_BASE = 'http://localhost:8080';
})();
