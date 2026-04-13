import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorker';
import { offlineStorage } from './utils/offlineStorage';
import { offlineSync } from './utils/offlineSync';

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
};

// Initialize offline storage and sync
offlineStorage.init().then(() => {
  console.log('[App] Offline storage initialized');
  
  // Start auto-sync (every 30 seconds when online)
  offlineSync.startAutoSync(30000);
});

// Register service worker for PWA
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);

