import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nContext.jsx';
import './index.css';

// Installed home-screen apps can sit open for days without a normal
// navigation, so the service worker never gets a chance to notice a new
// deploy. Poll for updates and activate them as soon as they're found
// instead of waiting for the next cold start.
const updateSW = registerSW({
  onRegisteredSW(url, registration) {
    if (!registration) return;
    setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});
void updateSW;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
