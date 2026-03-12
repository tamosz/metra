import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.js';

// Beacon: maintain SSE connection so eventstream tracks metra visitors
(function beacon() {
  let backoff = 1000;
  function connect() {
    const es = new EventSource('/events?page=metra');
    es.onopen = () => { backoff = 1000; };
    es.onerror = () => {
      es.close();
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 60000);
    };
  }
  connect();
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
