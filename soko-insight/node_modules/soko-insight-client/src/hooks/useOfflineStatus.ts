import { useState, useEffect } from 'react';
import { offlineStorage } from '../utils/offlineStorage';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(offlineStorage.isOnline());

  useEffect(() => {
    const removeOnlineListener = offlineStorage.onOnline(() => {
      setIsOnline(true);
    });

    const removeOfflineListener = offlineStorage.onOffline(() => {
      setIsOnline(false);
    });

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, []);

  return isOnline;
}

