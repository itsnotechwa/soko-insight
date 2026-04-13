// Offline storage using IndexedDB
const DB_NAME = 'soko-insight-offline';
const DB_VERSION = 1;
const STORE_NAMES = {
  SALES: 'sales',
  REQUESTS: 'requests',
  PRODUCTS: 'products',
};

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORE_NAMES.SALES)) {
          const salesStore = db.createObjectStore(STORE_NAMES.SALES, {
            keyPath: 'id',
          });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.REQUESTS)) {
          const requestsStore = db.createObjectStore(STORE_NAMES.REQUESTS, {
            keyPath: 'id',
          });
          requestsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.PRODUCTS)) {
          db.createObjectStore(STORE_NAMES.PRODUCTS, { keyPath: 'id' });
        }
      };
    });
  }

  // Queue a request for later sync
  async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    if (!this.db) await this.init();

    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.REQUESTS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.REQUESTS);
      const request = store.add(queuedRequest);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all queued requests
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.REQUESTS], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.REQUESTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove a queued request after successful sync
  async removeQueuedRequest(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.REQUESTS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.REQUESTS);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  // Update retry count for a request
  async updateRequestRetry(id: string, retries: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.REQUESTS], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.REQUESTS);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const request = getRequest.result;
        if (request) {
          request.retries = retries;
          const updateRequest = store.put(request);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Store sales data offline
  async saveSalesOffline(sales: any[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.SALES], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SALES);

      sales.forEach((sale) => {
        store.put({ ...sale, timestamp: Date.now() });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get offline sales
  async getOfflineSales(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.SALES], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.SALES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear offline sales after successful sync
  async clearOfflineSales(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.SALES], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.SALES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Register online/offline event listeners
  onOnline(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }

  onOffline(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('offline', handler);
    return () => window.removeEventListener('offline', handler);
  }
}

export const offlineStorage = new OfflineStorage();

